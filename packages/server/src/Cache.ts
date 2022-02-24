import {
  Config,
  createError,
  docFromEntry,
  Entry,
  entryFromDoc,
  EntryStatus,
  Schema
} from '@alinea/core'
import {Search} from '@alinea/core/Search'
import {
  generateKeyBetween,
  isValidOrderKey
} from '@alinea/core/util/FractionalIndexing'
import {Expr, Store} from '@alinea/store'
import {SqliteStore} from '@alinea/store/sqlite/SqliteStore'
import convertHrtime from 'convert-hrtime'
import prettyMilliseconds from 'pretty-ms'
import * as Y from 'yjs'
import {Data} from './Data'
import {parentUrl, walkUrl} from './util/Urls'

export namespace Cache {
  function indexSearch(store: Store, entry: Entry) {
    // Todo: unroll languages
    const row = {id: entry.id, title: String(entry.title)}
    const condition = Search.where(Search.id.is(entry.id))
    const existing = store.first(condition)
    if (existing) store.update(condition, row)
    else store.insert(Search, row)
  }

  function nextValidIndex(
    entries: Array<{id: string; index: string | null}>,
    from: number
  ) {
    while (from++ < entries.length - 1) {
      const entry = entries[from]
      if (entry.index) return entry.index
    }
    return null
  }

  function validateOrdersFor(store: Store, condition: Expr<boolean>) {
    const seen = new Set()
    const entries = store
      .all(
        Entry.select({
          id: Entry.id,
          index: Entry.index,
          $isContainer: Entry.$isContainer
        })
          .where(condition)
          .orderBy(Entry.index.asc())
      )
      .map(entry => {
        const isValid = isValidOrderKey(entry.index) && !seen.has(entry.index)
        seen.add(entry.index)
        return isValid ? entry : {...entry, index: null}
      })
    let prev: string | null = null
    entries.forEach((entry, i) => {
      if (!entry.index) {
        const next = nextValidIndex(entries, i)
        entry.index = generateKeyBetween(prev, next)
        store.update(Entry.where(Entry.id.is(entry.id)), {index: entry.index})
      }
      seen.add(entry.index)
      prev = entry.index
      if (entry.$isContainer)
        validateOrdersFor(store, Entry.parent.is(entry.id))
    })
  }

  function validateOrder(store: Store) {
    const roots = store.all(
      Entry.select({
        workspace: Entry.workspace,
        root: Entry.root
      })
        .where(Entry.parent.isNull())
        .groupBy(Entry.workspace, Entry.root)
    )
    for (const root of roots) {
      validateOrdersFor(
        store,
        Entry.workspace
          .is(root.workspace)
          .and(Entry.root.is(root.root))
          .and(Entry.parent.isNull())
      )
    }
  }

  export async function create(store: SqliteStore, from: Data.Source) {
    const startTime = process.hrtime.bigint()
    process.stdout.write('> Start indexing...')
    store.delete(Entry)
    store.createFts5Table(Search, 'Search', () => {
      return {title: Search.title}
    })
    let total = 0
    for await (const entry of from.entries()) {
      total++
      store.insert(Entry, entry)
      indexSearch(store, entry)
    }
    store.createIndex(Entry, 'root', [Entry.root])
    store.createIndex(Entry, 'parent', [Entry.parent])
    store.createIndex(Entry, 'workspace.type', [Entry.workspace, Entry.type])
    store.createIndex(Entry, 'url', [Entry.url])
    validateOrder(store)
    const diff = process.hrtime.bigint() - startTime
    console.log(
      `\r> Indexed ${total} entries in ${prettyMilliseconds(
        convertHrtime(diff).milliseconds
      )}`
    )
  }

  function computeEntry(store: Store, config: Config | Schema, entry: Entry) {
    const type =
      config instanceof Config
        ? config.type(entry.workspace, entry.type)
        : config.type(entry.type)
    if (!type) throw createError(400, 'Type not found')
    const parents = walkUrl(parentUrl(entry.url)).map(url => {
      const parent = store.first(
        Entry.where(Entry.workspace.is(entry.workspace))
          .where(Entry.root.is(entry.root))
          .where(Entry.url.is(url))
          .select({id: Entry.id})
      )
      if (!parent) throw createError(400, 'Parent not found')
      return parent.id
    })
    return {
      ...entry,
      parent: parents[parents.length - 1],
      parents: parents,
      $isContainer: type!.options.isContainer,
      $status: EntryStatus.Draft
    }
  }

  export function applyUpdates(
    store: Store,
    config: Config | Schema,
    updates: Array<{id: string; update: Uint8Array}>
  ) {
    for (const {id, update} of updates) {
      const condition = Entry.where(Entry.id.is(id))
      const existing = store.first(condition)
      const doc = new Y.Doc()
      if (existing) docFromEntry(config, existing, doc)
      Y.applyUpdate(doc, update)
      const data = entryFromDoc(config, doc)
      const entry = computeEntry(store, config, data)
      if (existing) store.update(condition, entry)
      else store.insert(Entry, entry)
      indexSearch(store, entry)
    }
    validateOrder(store)
  }

  export function applyPublish(
    store: Store,
    config: Config | Schema,
    entries: Array<Entry>
  ) {
    return store.transaction(() => {
      for (const data of entries) {
        const entry = computeEntry(store, config, data)
        const condition = Entry.where(Entry.id.is(entry.id))
        const existing = store.first(condition)
        if (existing) store.update(condition, entry)
        else store.insert(Entry, entry)
        indexSearch(store, entry)
      }
    })
  }
}

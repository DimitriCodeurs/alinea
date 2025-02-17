import {Schema, type} from '@alinea/core'
import {link} from '@alinea/input.link'
import {text} from '@alinea/input.text'

export const ChapterLinkBlockSchema = type('Chapter link', {
  link: link.entry('Link', {
    fields: type('Link fields', {
      description: text('Description', {multiline: true})
    }),
    inline: true
  })
})

export type ChapterLinkBlockSchema = Schema.TypeOf<
  typeof ChapterLinkBlockSchema
>

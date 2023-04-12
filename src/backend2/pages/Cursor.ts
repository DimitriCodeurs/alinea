import {createId} from 'alinea/core/Id'
import {array, boolean, enums, number, object, string, tuple} from 'cito'
import {ExprData} from './Expr.js'
import {Projection} from './Projection.js'
import {Query, QueryData} from './Query.js'
import {TargetData} from './Target.js'

export type CursorData = typeof CursorData.infer
export const CursorData = object(
  class {
    id = string
    target? = TargetData.optional
    where? = ExprData.adt.optional
    skip? = number.optional
    take? = number.optional
    orderBy? = array(ExprData.adt).optional
    select? = QueryData.adt.optional
    first? = boolean.optional
    source? = tuple(enums(SourceType), string).optional
  }
)

export enum SourceType {
  Children = 'Children',
  Siblings = 'Siblings',
  Parents = 'Parents',
  Parent = 'Parent',
  Next = 'Next',
  Previous = 'Previous'
}

export interface Cursor<T> {
  [Cursor.Data]: CursorData
}

declare const brand: unique symbol
export class Cursor<T> {
  declare [brand]: T

  constructor(data: CursorData) {
    this[Cursor.Data] = data
  }

  protected get id() {
    return this[Cursor.Data].id
  }

  protected with(data: Partial<CursorData>): CursorData {
    return {...this[Cursor.Data], id: createId(), ...data}
  }

  static isCursor<T>(input: any): input is Cursor<T> {
    return input instanceof Cursor
  }

  toJSON() {
    return this[Cursor.Data]
  }
}

export namespace Cursor {
  export const Data = Symbol('Cursor.Data')

  export class Find<Row> extends Cursor<Array<Row>> {
    where(where: ExprData): Find<Row> {
      return new Find(this.with({where}))
    }

    get<S extends Projection<Row>>(select?: S): Get<Query.Infer<S>> {
      const query = this.with({first: true})
      if (select) query.select = QueryData(select, this.id)
      return new Get<Query.Infer<S>>(query)
    }

    select<S extends Projection<Row>>(select: S): Find<Query.Infer<S>> {
      return new Find<Query.Infer<S>>(
        this.with({select: QueryData(select, this.id)})
      )
    }
  }

  export class Get<Row> extends Cursor<Row> {
    where(where: ExprData): Get<Row> {
      return new Get<Row>(this.with({where}))
    }

    select<S extends Projection<Row>>(select: S): Get<Query.Infer<S>> {
      return new Get<Query.Infer<S>>(
        this.with({select: QueryData(select, this.id)})
      )
    }
  }
}

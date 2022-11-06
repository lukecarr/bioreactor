import type { NextApiHandler, NextApiRequest } from 'next'

export type DataField = {
  property: string
  name: string
}

export type DataValueFunctions<T extends string> = {
  [key in T]: () => DataField & {
    type: key
  }
}

export type Aggregations = 'count'

export type DataValue =
  & DataField
  & DataValueFunctions<Aggregations>

export type Table<T> =
  & {
    [column in keyof T]: DataValue
  }
  & {
    handler: (source: (req: NextApiRequest) => Promise<T[]>) => NextApiHandler
  }

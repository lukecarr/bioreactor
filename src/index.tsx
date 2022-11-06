import type { NextApiRequest, NextApiResponse } from 'next'
import type { Table } from './types'

export * from './components/Matrix'

function parseFields(query: string | string[] | undefined) {
  if (typeof query === 'undefined') return []
  else if (typeof query === 'string') return query.split(',')
  else return query[0].split(',')
}

export function defineTable<T, U extends string>(
  {
    name,
    columns,
  }: {
    name: U
    columns: Array<keyof T>
  },
): Table<T> {
  return {
    ...Object.fromEntries(columns.map((column) => [column, {
      property: `${name}.${String(column)}`,
      name: String(column),
      count: () => ({
        property: `${name}.${String(column)}`,
        name: String(column),
        type: 'count',
      }),
    }])),
    handler: (source) => async (req: NextApiRequest, res: NextApiResponse) => {
      const { bi } = req.query
      if (typeof bi === 'undefined' || bi.length < 2 || bi[0] !== 'bioreactor') return res.status(404).end()
      const data = await source(req)

      if (bi[1] === 'fetch') {
        const vals = [] as any[]
        const fields = parseFields(req.query.fields)
        const properties = fields.map(x => x.split('.')[1])
        const tableName = fields[0].split('.')[0]

        let i = 0, l = data.length

        while (i < l) {
          let val: any = {}
          for (const prop of properties) {
            val[`${tableName}.${prop}`] = data[i][prop as keyof T]
          }
          vals.push(val)
          i++
        }

        return res.status(200).json({
          values: vals,
        })
      }

      res.status(404).end()
    },
  } as Table<T>
}

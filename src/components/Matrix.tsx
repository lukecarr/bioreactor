import { ReactNode, useMemo } from 'react'
import useSWR from 'swr'
import type { Aggregations, DataField, DataValue } from '../types'

const typeNames: {
  [key in Aggregations]: (val: any) => string
} = {
  count: (val: any) => `Count of ${val}`,
}

export function Matrix(
  { columns, rows, values, appearance }:
    & Partial<{
      columns: DataField
      rows: DataField
      appearance: Partial<{
        placeholder: () => ReactNode
        classNames: Partial<{
          table: string
          header: string
          body: string
          row: (index: number) => string
          columnHeader: (index: number, column: DataField) => string
          rowHeader: (index: number, row: DataField) => string
          cell: (value: DataValue) => string
        }>
      }>
    }>
    & {
      values: DataValue
    },
) {
  const { data } = useSWR<{
    values: any[]
  }>(
    `/api/bioreactor/fetch?${new URLSearchParams({
      fields: [
        values.property,
        columns?.property,
        rows?.property,
      ].filter(x => x).join(','),
    })}`,
    (...args) => fetch.apply(null, args as any).then(res => res.json()),
  )

  const columnHeadings = useMemo<string[] | null>(() => {
    if (typeof data === 'undefined') return []
    if (typeof columns === 'undefined') return null

    const headings = new Set<string>()

    for (let i = 0; i < data.values.length; i++) {
      headings.add(data.values[i][columns.property])
    }

    return Array.from(headings)
  }, [columns, values, data])

  const rowHeadings = useMemo<string[] | null>(() => {
    if (typeof data === 'undefined') return []
    if (typeof rows === 'undefined') return null

    const headings = new Set<string>()

    for (let i = 0; i < data.values.length; i++) {
      headings.add(data.values[i][rows.property])
    }

    return Array.from(headings).sort()
  }, [rows, values, data])

  const matrixValues = useMemo<any | any[][] | null>(() => {
    if (typeof data === 'undefined') return null

    if (columnHeadings === null && rowHeadings === null) return data.values.length
    else if (rowHeadings === null && columnHeadings !== null) {
      const arr = new Array<any>(columnHeadings.length)
      const colProp = columns!.property

      for (let i = 0; i < columnHeadings.length; i++) {
        arr[i] = data.values.filter(x => x[colProp] === columnHeadings[i]).length
      }

      return [arr]
    } else if (rowHeadings !== null && columnHeadings !== null) {
      const arr = new Array<any[]>(rowHeadings.length)
      const colProp = columns!.property
      const rowProp = rows!.property

      for (let i = 0; i < rowHeadings.length; i++) {
        const arr2 = new Array<any>(columnHeadings.length)
        for (let j = 0; j < columnHeadings.length; j++) {
          arr2[j] = data.values.filter(x => x[colProp] === columnHeadings[j] && x[rowProp] === rowHeadings[i]).length
        }

        arr[i] = arr2
      }

      return arr
    } else if (rowHeadings !== null && columnHeadings === null) {
      const arr = new Array<any[]>(rowHeadings.length)
      const rowProp = rows!.property.split('.')[1]

      for (let i = 0; i < rowHeadings.length; i++) {
        arr[i] = [data.values.filter(x => x[rowProp] === rowHeadings[i]).length]
      }

      return arr
    }
  }, [data, columnHeadings, rowHeadings, values])

  return (
    <>
      {matrixValues === null || !data
        ? appearance?.placeholder ?? null
        : (
          <table className={appearance?.classNames?.table}>
            <thead className={appearance?.classNames?.header}>
              <tr>
                {rows ? <th className={appearance?.classNames?.columnHeader?.(0, rows)}>{rows.name}</th> : null}
                {columns && columnHeadings
                  ? (
                    <>
                      {columnHeadings.map((heading, idx) => (
                        <th key={idx} className={appearance?.classNames?.columnHeader?.(rows ? idx + 1 : idx, columns)}>
                          {heading}
                        </th>
                      ))}
                    </>
                  )
                  : (
                    <th className={appearance?.classNames?.columnHeader?.(rows ? 1 : 0, values)}>
                      {(typeNames as any)[(values as any).type](values.name)}
                    </th>
                  )}
              </tr>
            </thead>
            <tbody className={appearance?.classNames?.body}>
              {rows && rowHeadings
                ? rowHeadings.map((row, idx) => (
                  <tr key={idx} className={appearance?.classNames?.row?.(idx)}>
                    <td className={appearance?.classNames?.rowHeader?.(idx, rows)}>{row}</td>
                    {matrixValues[idx].map((value: any, idx2: number) => (
                      <td key={idx2} className={appearance?.classNames?.cell?.(values)}>{value}</td>
                    ))}
                  </tr>
                ))
                : (
                  <tr className={appearance?.classNames?.row?.(0)}>
                    {columnHeadings === null
                      ? matrixValues
                      : matrixValues[0].map((value: any, idx: number) => (
                        <td key={idx} className={appearance?.classNames?.cell?.(values)}>{value}</td>
                      ))}
                  </tr>
                )}
            </tbody>
          </table>
        )}
    </>
  )
}

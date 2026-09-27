/** A label/value line shown in an info card. Rows without a value are skipped. */
export interface InfoRow {
  label: string
  value: string | undefined
  /** Secondary text shown after the value, e.g. the exact byte count. */
  hint?: string
  /** Render the value in a monospace font (hashes, serial numbers…). */
  mono?: boolean
}

export function presentRows(rows: InfoRow[]) {
  return rows.filter((row): row is InfoRow & { value: string } => Boolean(row.value))
}

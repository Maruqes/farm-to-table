const moneyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
})

const dateFormatter = new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' })

const dateTimeFormatter = new Intl.DateTimeFormat('en-IE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value)
}

export function formatDate(value: string | number | Date): string {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : '—'
}

export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : '—'
}

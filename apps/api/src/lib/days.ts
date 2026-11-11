const TIME_ZONE = 'Europe/Lisbon'
const DAY_MS = 86_400_000

export const LOCAL_TIME_ZONE = TIME_ZONE

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const OFFSET_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function part(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((entry) => entry.type === type)?.value
  if (value === undefined) throw new Error(`Missing ${type} in formatted date`)
  return Number(value)
}

export function localDayKey(date: Date): string {
  const parts = DATE_FORMAT.formatToParts(date)
  const month = String(part(parts, 'month')).padStart(2, '0')
  const day = String(part(parts, 'day')).padStart(2, '0')
  return `${part(parts, 'year')}-${month}-${day}`
}

export function recentLocalDays(count = 7, now = new Date()): string[] {
  const [year, month, day] = localDayKey(now).split('-').map(Number)
  const noon = new Date(Date.UTC(year!, month! - 1, day!, 12))
  return Array.from({ length: count }, (_, index) =>
    localDayKey(new Date(noon.getTime() - (count - 1 - index) * DAY_MS)),
  )
}

export function localDayStart(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  const guess = new Date(Date.UTC(year!, month! - 1, date!))
  const parts = OFFSET_FORMAT.formatToParts(guess)
  const asUtc = Date.UTC(
    part(parts, 'year'),
    part(parts, 'month') - 1,
    part(parts, 'day'),
    part(parts, 'hour'),
    part(parts, 'minute'),
    part(parts, 'second'),
  )
  return new Date(guess.getTime() - (asUtc - guess.getTime()))
}

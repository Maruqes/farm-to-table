import type { PendingProducerDto } from './admin-producers.dto'
import type { PendingProducer } from './admin-producers.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asDate(value: unknown): string | null {
  const date = asString(value)
  return date && !Number.isNaN(Date.parse(date)) ? date : null
}

function asCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const categories: string[] = []

  for (const entry of value) {
    const label = asString(entry)
    const key = label.toLowerCase()
    if (!label || seen.has(key)) continue
    seen.add(key)
    categories.push(label)
  }

  return categories
}

export function adaptPendingProducer(
  dto: PendingProducerDto,
  index = 0,
): PendingProducer {
  return {
    id: asString(dto?.id || dto?._id, `producer-${index + 1}`),
    name: asString(dto?.name, 'Unnamed producer'),
    email: asString(dto?.email),
    phone: asString(dto?.phone),
    location: asString(dto?.location, 'Location not provided'),
    bio: asString(dto?.bio),
    categories: asCategories(dto?.categories),
    appliedAt: asDate(dto?.appliedAt || dto?.createdAt),
  }
}

export function adaptPendingProducers(
  dto: PendingProducerDto[] | null | undefined,
): PendingProducer[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((producer, index) => adaptPendingProducer(producer, index))
}

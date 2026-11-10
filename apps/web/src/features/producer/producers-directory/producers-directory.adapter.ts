import type { ProducerDirectoryItemDto } from './producers-directory.dto'
import type { ProducerDirectoryItem } from './producers-directory.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asRating(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(5, Math.max(0, value))
}

export function adaptProducerDirectoryItem(
  dto: ProducerDirectoryItemDto | null | undefined,
): ProducerDirectoryItem {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
    averageRating: asRating(dto?.averageRating),
    productCount: Math.max(0, Math.floor(asNumber(dto?.productCount))),
  }
}

export function adaptProducersDirectory(
  dtos: ProducerDirectoryItemDto[] | null | undefined,
): ProducerDirectoryItem[] {
  if (!Array.isArray(dtos)) return []
  return dtos
    .map(adaptProducerDirectoryItem)
    .filter((producer) => producer.id !== '')
}

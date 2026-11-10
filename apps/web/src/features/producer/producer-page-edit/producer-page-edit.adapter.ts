import type { ProducerPageDto } from './producer-page-edit.dto'
import type { ProducerPage } from './producer-page-edit.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

export function adaptProducerPage(
  dto: ProducerPageDto | null | undefined,
): ProducerPage {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Your farm'),
    bio: asString(dto?.bio),
    location: asString(dto?.location),
    lat: asCoordinate(dto?.lat, -90, 90),
    lng: asCoordinate(dto?.lng, -180, 180),
    photoUrl: asString(dto?.photoUrl),
  }
}

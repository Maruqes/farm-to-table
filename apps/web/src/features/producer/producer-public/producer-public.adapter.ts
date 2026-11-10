import type {
  ProducerPublicDto,
  ProducerPublicProductDto,
} from './producer-public.dto'
import type { ProducerProduct, ProducerPublic } from './producer-public.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asRating(value: unknown): number {
  return Math.min(5, Math.max(0, asNumber(value)))
}

function asCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

type ProducerIdentity = Pick<ProducerPublic, 'id' | 'name' | 'location'>

function adaptProduct(
  dto: ProducerPublicProductDto | null | undefined,
  producer: ProducerIdentity,
): ProducerProduct {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Unnamed product'),
    price: asNumber(dto?.price),
    unit: asString(dto?.unit, 'unit'),
    stock: Math.max(0, Math.floor(asNumber(dto?.stock))),
    category: asString(dto?.category, 'other'),
    imageUrl: asString(dto?.imageUrl),
    producer: {
      id: producer.id,
      name: producer.name,
      location: producer.location,
    },
    averageRating: asRating(dto?.averageRating),
  }
}

export function adaptProducerPublic(
  dto: ProducerPublicDto | null | undefined,
): ProducerPublic {
  const producer: ProducerIdentity = {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
  }
  const products = Array.isArray(dto?.products) ? dto.products : []

  return {
    ...producer,
    bio: asString(dto?.bio),
    lat: asCoordinate(dto?.lat, -90, 90),
    lng: asCoordinate(dto?.lng, -180, 180),
    averageRating: asRating(dto?.averageRating),
    products: products.map((product) => adaptProduct(product, producer)),
  }
}

import type { ProducerProductDto } from './producer-products.dto'
import type { ProducerProduct } from './producer-products.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asMoney(value: unknown): number {
  return Math.round(Math.max(0, asNumber(value)) * 100) / 100
}

function asStock(value: unknown): number {
  return Math.max(0, Math.floor(asNumber(value)))
}

export function adaptProducerProduct(
  dto: ProducerProductDto | null | undefined,
): ProducerProduct {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Unnamed product'),
    category: asString(dto?.category, 'vegetables'),
    price: asMoney(dto?.price),
    unit: asString(dto?.unit, 'kg'),
    stock: asStock(dto?.stock),
    season: asString(dto?.season, 'all-year'),
    organic: dto?.organic === true,
    imageUrl: asString(dto?.imageUrl),
  }
}

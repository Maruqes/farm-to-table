import { ApiError } from '@/services/api'
import { adaptLiveAuction, adaptProduct } from './catalog.adapter'
import type { AuctionSummaryDto, ProductDto } from './catalog.dto'
import type { CatalogService } from './catalog.service'
import type { CatalogQuery, LiveAuction, Product } from './catalog.types'
import { createMockAuctions } from './mocks/auctions'
import { MOCK_PRODUCTS, type MockProductRecord } from './mocks/products'

const MOCK_LATENCY_MS = 450

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

function toProductDto(record: MockProductRecord): ProductDto {
  return {
    id: record.id,
    name: record.name,
    price: record.price,
    unit: record.unit,
    stock: record.stock,
    category: record.category,
    producer: record.producer,
    averageRating: record.averageRating,
    ...(record.imageUrl ? { imageUrl: record.imageUrl } : {}),
  }
}

function matchesText(record: MockProductRecord, query: string): boolean {
  const needle = normalise(query)
  if (!needle) return true
  return (
    normalise(record.name).includes(needle) ||
    normalise(record.ingredients).includes(needle) ||
    normalise(record.producer.name).includes(needle)
  )
}

function matchesQuery(record: MockProductRecord, query: CatalogQuery): boolean {
  if (!record.approved || record.hidden || record.stock <= 0) return false
  if (!matchesText(record, query.q ?? '')) return false
  if (query.producer) {
    const needle = normalise(query.producer)
    if (
      normalise(record.producer.id) !== needle &&
      normalise(record.producer.name) !== needle
    ) {
      return false
    }
  }
  if (query.category && record.category !== query.category) return false
  if (query.location && !normalise(record.producer.location).includes(normalise(query.location))) {
    return false
  }
  if (query.season && record.season !== query.season) return false
  if (query.organic === true && !record.organic) return false
  if (query.organic === false && record.organic) return false
  return true
}

function sortProducts(records: MockProductRecord[], sort: CatalogQuery['sort']): MockProductRecord[] {
  if (!sort) return records
  const sorted = [...records]
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  if (sort === 'rating-desc') sorted.sort((a, b) => b.averageRating - a.averageRating)
  return sorted
}

export const catalogMockService: CatalogService = {
  async listProducts(query: CatalogQuery): Promise<Product[]> {
    await wait()
    if (normalise(query.q ?? '') === 'error') {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The catalog could not be loaded. Please try again.',
      )
    }
    if (normalise(query.q ?? '') === 'empty') {
      return []
    }
    return sortProducts(
      MOCK_PRODUCTS.filter((record) => matchesQuery(record, query)),
      query.sort,
    ).map((record) => adaptProduct(toProductDto(record)))
  },

  async listLiveAuctions(limit: number): Promise<LiveAuction[]> {
    await wait()
    const auctions: AuctionSummaryDto[] = createMockAuctions()
    return auctions.slice(0, Math.max(0, limit)).map(adaptLiveAuction)
  },
}

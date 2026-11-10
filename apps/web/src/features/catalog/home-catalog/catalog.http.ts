import { api } from '@/services/api'
import { adaptLiveAuction, adaptProduct } from './catalog.adapter'
import type { AuctionSummaryDto, ProductDto } from './catalog.dto'
import type { CatalogService } from './catalog.service'
import type { CatalogQuery, LiveAuction, Product } from './catalog.types'

function productParams(query: CatalogQuery): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.producer) params.set('producer', query.producer)
  if (query.category) params.set('category', query.category)
  if (query.location) params.set('location', query.location)
  if (query.season) params.set('season', query.season)
  if (query.organic !== undefined) params.set('organic', String(query.organic))
  if (query.sort) params.set('sort', query.sort)
  const search = params.toString()
  return search ? `?${search}` : ''
}

export const catalogHttpService: CatalogService = {
  async listProducts(query: CatalogQuery): Promise<Product[]> {
    const dto = await api<ProductDto[]>(`/products${productParams(query)}`)
    return (dto ?? []).map(adaptProduct)
  },

  async listLiveAuctions(limit: number): Promise<LiveAuction[]> {
    const dto = await api<AuctionSummaryDto[]>(`/auctions?status=active&limit=${limit}`)
    return (dto ?? []).map(adaptLiveAuction)
  },
}

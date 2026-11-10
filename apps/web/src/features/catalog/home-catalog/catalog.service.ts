import { USE_MOCKS } from '@/services/env'
import type { CatalogQuery, LiveAuction, Product } from './catalog.types'
import { catalogHttpService } from './catalog.http'
import { catalogMockService } from './catalog.mock'

export interface CatalogService {
  listProducts(query: CatalogQuery): Promise<Product[]>
  listLiveAuctions(limit: number): Promise<LiveAuction[]>
}

export const catalogService: CatalogService = USE_MOCKS ? catalogMockService : catalogHttpService

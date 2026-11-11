import { USE_MOCKS } from '@/services/env'
import type { ProductDetail } from './product-detail.types'
import { productDetailHttpService } from './product-detail.http'
import { productDetailMockService } from './product-detail.mock'

export interface ProductDetailService {
  getProduct(id: string): Promise<ProductDetail>
}

export const productDetailService: ProductDetailService = USE_MOCKS
  ? productDetailMockService
  : productDetailHttpService

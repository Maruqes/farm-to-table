import { ApiError } from '@/services/api'
import { adaptProductDetail } from './product-detail.adapter'
import type { ProductDetailService } from './product-detail.service'
import type { ProductDetail } from './product-detail.types'
import {
  createMockProductDetail,
  MOCK_ERROR_PRODUCT_ID,
} from './mocks/product-details'

const MOCK_LATENCY_MS = 400

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

export const productDetailMockService: ProductDetailService = {
  async getProduct(id: string): Promise<ProductDetail> {
    await wait()
    if (id === MOCK_ERROR_PRODUCT_ID) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'This product could not be loaded. Please try again.',
      )
    }
    const dto = createMockProductDetail(id)
    if (!dto) {
      throw new ApiError(
        404,
        'PRODUCT_NOT_FOUND',
        'We could not find this product. It may have been removed.',
      )
    }
    return adaptProductDetail(dto)
  },
}

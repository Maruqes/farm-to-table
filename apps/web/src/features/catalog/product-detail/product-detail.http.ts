import { api } from '@/services/api'
import { adaptProductDetail } from './product-detail.adapter'
import type { ProductDetailDto } from './product-detail.dto'
import type { ProductDetailService } from './product-detail.service'
import type { ProductDetail } from './product-detail.types'

export const productDetailHttpService: ProductDetailService = {
  async getProduct(id: string): Promise<ProductDetail> {
    const dto = await api<ProductDetailDto>(`/products/${encodeURIComponent(id)}`)
    return adaptProductDetail(dto)
  },
}

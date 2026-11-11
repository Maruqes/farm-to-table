import { api } from '@/services/api'
import type {
  ProducerProductDto,
  ProducerProductImageDto,
  SaveProducerProductRequestDto,
} from './producer-products.dto'
import type { ProducerProductsService } from './producer-products.service'
import type { ProductInput } from './producer-products.types'

function toBody(input: ProductInput): SaveProducerProductRequestDto {
  return {
    name: input.name,
    category: input.category,
    price: input.price,
    unit: input.unit,
    stock: input.stock,
    season: input.season,
    organic: input.organic,
  }
}

export const producerProductsHttpService: ProducerProductsService = {
  async listMine(): Promise<ProducerProductDto[]> {
    return api<ProducerProductDto[]>('/products?producer=me')
  },

  async create(input: ProductInput): Promise<ProducerProductDto> {
    return api<ProducerProductDto>('/products', {
      method: 'POST',
      body: JSON.stringify(toBody(input)),
    })
  },

  async update(id: string, input: ProductInput): Promise<ProducerProductDto> {
    return api<ProducerProductDto>(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(toBody(input)),
    })
  },

  async remove(id: string): Promise<void> {
    await api<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  async uploadImage(id: string, file: File): Promise<string> {
    const form = new FormData()
    form.append('image', file)
    const result = await api<ProducerProductImageDto>(
      `/products/${encodeURIComponent(id)}/image`,
      { method: 'POST', body: form },
    )
    return result.imageUrl?.trim() ?? ''
  },
}

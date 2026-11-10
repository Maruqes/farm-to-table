import { USE_MOCKS } from '@/services/env'
import type { ProducerProductDto } from './producer-products.dto'
import { producerProductsHttpService } from './producer-products.http'
import { producerProductsMockService } from './producer-products.mock'
import type { ProductInput } from './producer-products.types'

export interface ProducerProductsService {
  listMine(): Promise<ProducerProductDto[]>
  create(input: ProductInput): Promise<ProducerProductDto>
  update(id: string, input: ProductInput): Promise<ProducerProductDto>
  remove(id: string): Promise<void>
  uploadImage(id: string, file: File): Promise<string>
}

export const producerProductsService: ProducerProductsService = USE_MOCKS
  ? producerProductsMockService
  : producerProductsHttpService

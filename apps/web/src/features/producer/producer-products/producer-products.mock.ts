import { ApiError } from '@/services/api'
import type { ProducerProductDto } from './producer-products.dto'
import type { ProducerProductsService } from './producer-products.service'
import type { ProductInput } from './producer-products.types'
import { createMockProducerProducts } from './mocks/products'

const MOCK_LATENCY_MS = 550

// Set `ftt.producer-products.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_PRODUCTS_ERROR_KEY = 'ftt.producer-products.mock-error'
// Set `ftt.producer-products.mock-empty` to `1` to exercise the empty state.
export const MOCK_PRODUCTS_EMPTY_KEY = 'ftt.producer-products.mock-empty'

let store: ProducerProductDto[] | null = null
let nextId = 1

function getStore(): ProducerProductDto[] {
  if (!store) store = createMockProducerProducts()
  return store
}

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function clone(dto: ProducerProductDto): ProducerProductDto {
  return { ...dto }
}

function notFound(): ApiError {
  return new ApiError(
    404,
    'PRODUCT_NOT_FOUND',
    'This product no longer exists. Refresh the list and try again.',
  )
}

function toDto(input: ProductInput): Omit<ProducerProductDto, 'id'> {
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

export const producerProductsMockService: ProducerProductsService = {
  async listMine(): Promise<ProducerProductDto[]> {
    await wait()

    if (isFlagOn(MOCK_PRODUCTS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your products could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_PRODUCTS_EMPTY_KEY)) return []

    return getStore().map(clone)
  },

  async create(input: ProductInput): Promise<ProducerProductDto> {
    await wait()
    const dto: ProducerProductDto = {
      id: `prod-mock-new-${nextId}`,
      ...toDto(input),
    }
    nextId += 1
    getStore().unshift(dto)
    return clone(dto)
  },

  async update(id: string, input: ProductInput): Promise<ProducerProductDto> {
    await wait()
    const dto = getStore().find((product) => product.id === id)
    if (!dto) throw notFound()
    Object.assign(dto, toDto(input))
    return clone(dto)
  },

  async remove(id: string): Promise<void> {
    await wait()
    const index = getStore().findIndex((product) => product.id === id)
    if (index === -1) throw notFound()
    getStore().splice(index, 1)
  },

  async uploadImage(id: string, file: File): Promise<string> {
    await wait()
    if (!file.type.startsWith('image/')) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Choose an image file.', {
        image: 'Choose an image file.',
      })
    }
    const dto = getStore().find((product) => product.id === id)
    if (!dto) throw notFound()
    const imageUrl = URL.createObjectURL(file)
    dto.imageUrl = imageUrl
    return imageUrl
  },
}

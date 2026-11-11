import { ApiError } from '@/services/api'
import { createMockProducerProducts } from '@/features/producer/producer-products/mocks/products'
import type {
  ProducerAuctionDto,
  ProducerAuctionProductDto,
} from './producer-auctions.dto'
import type { ProducerAuctionsService } from './producer-auctions.service'
import type { AuctionInput } from './producer-auctions.types'
import { createMockProducerAuctions } from './mocks/auctions'

const MOCK_LATENCY_MS = 500
const MINUTE_MS = 60_000

// Set `ftt.producer-auctions.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_AUCTIONS_ERROR_KEY = 'ftt.producer-auctions.mock-error'
// Set `ftt.producer-auctions.mock-empty` to `1` to exercise the empty state.
export const MOCK_AUCTIONS_EMPTY_KEY = 'ftt.producer-auctions.mock-empty'
// Set `ftt.producer-auctions.mock-save-error` to `1` to exercise a failed create or update.
export const MOCK_AUCTIONS_SAVE_ERROR_KEY = 'ftt.producer-auctions.mock-save-error'
// Set `ftt.producer-auctions.mock-cancel-error` to `1` to force the 409 AUCTION_HAS_BIDS cancel error.
export const MOCK_AUCTIONS_CANCEL_ERROR_KEY = 'ftt.producer-auctions.mock-cancel-error'

let store: ProducerAuctionDto[] | null = null
let nextId = 1

function getStore(): ProducerAuctionDto[] {
  if (!store) store = createMockProducerAuctions()
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

function clone(dto: ProducerAuctionDto): ProducerAuctionDto {
  const product =
    dto.product && typeof dto.product === 'object' ? { ...dto.product } : dto.product
  return { ...dto, product }
}

function notFound(): ApiError {
  return new ApiError(
    404,
    'AUCTION_NOT_FOUND',
    'This auction no longer exists. Refresh the list and try again.',
  )
}

function draftOnly(): ApiError {
  return new ApiError(
    409,
    'AUCTION_NOT_DRAFT',
    'Only drafts can be edited. Refresh the list to see the current state.',
  )
}

function productLookup(productId: string): ProducerAuctionProductDto {
  const product = createMockProducerProducts().find((entry) => entry.id === productId)
  return {
    id: productId,
    name: product?.name ?? 'Auction lot',
    category: product?.category ?? 'vegetables',
    unit: product?.unit ?? 'units',
  }
}

function endsAtFor(startsAt: string, durationMinutes: number): string {
  const start = Date.parse(startsAt)
  const base = Number.isNaN(start) ? Date.now() : start
  return new Date(base + Math.max(1, durationMinutes) * MINUTE_MS).toISOString()
}

function applyInput(dto: ProducerAuctionDto, input: AuctionInput): void {
  const product = productLookup(input.productId)
  dto.product = product
  dto.quantity = input.quantity
  dto.unit = product.unit ?? 'units'
  dto.basePrice = input.basePrice
  dto.increment = input.increment
  dto.durationMinutes = input.durationMinutes
  dto.startsAt = input.startsAt
  dto.endsAt = endsAtFor(input.startsAt, input.durationMinutes)
  dto.currentPrice = input.basePrice
}

export const producerAuctionsMockService: ProducerAuctionsService = {
  async listMine(): Promise<ProducerAuctionDto[]> {
    await wait()

    if (isFlagOn(MOCK_AUCTIONS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your auctions could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_AUCTIONS_EMPTY_KEY)) return []

    return getStore().map(clone)
  },

  async create(input: AuctionInput): Promise<ProducerAuctionDto> {
    await wait()

    if (isFlagOn(MOCK_AUCTIONS_SAVE_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The auction could not be saved. Please try again.',
      )
    }

    const now = Date.now()
    const dto: ProducerAuctionDto = {
      id: `auction-mock-new-${nextId}`,
      status: 'draft',
      quantity: input.quantity,
      basePrice: input.basePrice,
      increment: input.increment,
      durationMinutes: input.durationMinutes,
      startsAt: input.startsAt,
      currentPrice: input.basePrice,
      bidCount: 0,
      leader: null,
      createdAt: new Date(now).toISOString(),
    }
    nextId += 1
    applyInput(dto, input)
    getStore().unshift(dto)
    return clone(dto)
  },

  async update(id: string, input: AuctionInput): Promise<ProducerAuctionDto> {
    await wait()

    if (isFlagOn(MOCK_AUCTIONS_SAVE_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The auction could not be saved. Please try again.',
      )
    }

    const dto = getStore().find((entry) => entry.id === id || entry._id === id)
    if (!dto) throw notFound()
    if (dto.status !== 'draft') throw draftOnly()

    applyInput(dto, input)
    dto.bidCount = 0
    dto.leader = null
    return clone(dto)
  },

  async publish(id: string): Promise<ProducerAuctionDto> {
    await wait()

    if (isFlagOn(MOCK_AUCTIONS_SAVE_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The auction could not be published. Please try again.',
      )
    }

    const dto = getStore().find((entry) => entry.id === id || entry._id === id)
    if (!dto) throw notFound()
    if (dto.status !== 'draft') throw draftOnly()

    dto.status = 'scheduled'
    dto.currentPrice = dto.basePrice
    dto.bidCount = 0
    dto.leader = null
    if (dto.startsAt) {
      dto.endsAt = endsAtFor(dto.startsAt, dto.durationMinutes ?? 30)
    }
    return clone(dto)
  },

  async cancel(id: string): Promise<ProducerAuctionDto> {
    await wait()

    const dto = getStore().find((entry) => entry.id === id || entry._id === id)
    if (!dto) throw notFound()

    if (isFlagOn(MOCK_AUCTIONS_CANCEL_ERROR_KEY) || (dto.bidCount ?? 0) > 0) {
      throw new ApiError(
        409,
        'AUCTION_HAS_BIDS',
        'This auction already has bids, so it cannot be cancelled. Let it run to the end.',
      )
    }

    if (dto.status === 'ended') {
      throw new ApiError(
        409,
        'AUCTION_ALREADY_ENDED',
        'This auction has already ended.',
      )
    }

    dto.status = 'ended'
    dto.leader = null
    return clone(dto)
  },
}

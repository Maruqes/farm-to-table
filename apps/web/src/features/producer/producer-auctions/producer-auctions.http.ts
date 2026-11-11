import { api } from '@/services/api'
import type {
  ProducerAuctionDto,
  SaveProducerAuctionRequestDto,
} from './producer-auctions.dto'
import type { ProducerAuctionsService } from './producer-auctions.service'
import type { AuctionInput } from './producer-auctions.types'

function toBody(input: AuctionInput): SaveProducerAuctionRequestDto {
  return {
    productId: input.productId,
    quantity: input.quantity,
    basePrice: input.basePrice,
    increment: input.increment,
    durationMinutes: input.durationMinutes,
    startsAt: input.startsAt,
  }
}

export const producerAuctionsHttpService: ProducerAuctionsService = {
  async listMine(): Promise<ProducerAuctionDto[]> {
    return api<ProducerAuctionDto[]>('/auctions?producer=me')
  },

  async create(input: AuctionInput): Promise<ProducerAuctionDto> {
    return api<ProducerAuctionDto>('/auctions', {
      method: 'POST',
      body: JSON.stringify(toBody(input)),
    })
  },

  async update(id: string, input: AuctionInput): Promise<ProducerAuctionDto> {
    return api<ProducerAuctionDto>(`/auctions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(toBody(input)),
    })
  },

  async publish(id: string): Promise<ProducerAuctionDto> {
    return api<ProducerAuctionDto>(
      `/auctions/${encodeURIComponent(id)}/publish`,
      { method: 'POST' },
    )
  },

  async cancel(id: string): Promise<ProducerAuctionDto> {
    return api<ProducerAuctionDto>(
      `/auctions/${encodeURIComponent(id)}/cancel`,
      { method: 'POST' },
    )
  },
}

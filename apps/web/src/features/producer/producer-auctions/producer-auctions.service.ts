import { USE_MOCKS } from '@/services/env'
import type { ProducerAuctionDto } from './producer-auctions.dto'
import { producerAuctionsHttpService } from './producer-auctions.http'
import { producerAuctionsMockService } from './producer-auctions.mock'
import type { AuctionInput } from './producer-auctions.types'

export interface ProducerAuctionsService {
  listMine(): Promise<ProducerAuctionDto[]>
  create(input: AuctionInput): Promise<ProducerAuctionDto>
  update(id: string, input: AuctionInput): Promise<ProducerAuctionDto>
  publish(id: string): Promise<ProducerAuctionDto>
  cancel(id: string): Promise<ProducerAuctionDto>
}

export const producerAuctionsService: ProducerAuctionsService = USE_MOCKS
  ? producerAuctionsMockService
  : producerAuctionsHttpService

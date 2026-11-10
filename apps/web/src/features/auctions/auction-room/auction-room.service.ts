import { USE_MOCKS } from '@/services/env'
import type { AuctionBidDto, AuctionRoomDto } from './auction-room.dto'
import type { AuctionBidder } from './auction-room.types'
import { auctionRoomHttpService } from './auction-room.http'
import { auctionRoomMockService } from './auction-room.mock'

export interface AuctionRoomService {
  getAuction(id: string): Promise<AuctionRoomDto>
  placeBid(id: string, amount: number, bidder: AuctionBidder): Promise<AuctionBidDto>
}

export const auctionRoomService: AuctionRoomService = USE_MOCKS
  ? auctionRoomMockService
  : auctionRoomHttpService

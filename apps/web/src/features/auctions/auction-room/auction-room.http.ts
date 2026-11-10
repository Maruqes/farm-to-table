import { api } from '@/services/api'
import type { AuctionBidDto, AuctionRoomDto, PlaceBidRequestDto } from './auction-room.dto'
import type { AuctionRoomService } from './auction-room.service'
import type { AuctionBidder } from './auction-room.types'

export const auctionRoomHttpService: AuctionRoomService = {
  async getAuction(id: string): Promise<AuctionRoomDto> {
    return api<AuctionRoomDto>(`/auctions/${encodeURIComponent(id)}`)
  },

  async placeBid(
    id: string,
    amount: number,
    _bidder: AuctionBidder,
  ): Promise<AuctionBidDto> {
    const body: PlaceBidRequestDto = { amount }
    return api<AuctionBidDto>(`/auctions/${encodeURIComponent(id)}/bids`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

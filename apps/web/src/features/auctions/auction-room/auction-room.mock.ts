import { ApiError } from '@/services/api'
import type { AuctionBidDto } from './auction-room.dto'
import type { AuctionRoomService } from './auction-room.service'
import type { AuctionBidder } from './auction-room.types'
import { MOCK_AUCTION_ERROR_ID, MOCK_AUCTION_RACE_ID } from './mocks/auctions'
import {
  addMockBid,
  emitMockBidRejected,
  getMockAuction,
} from './mocks/store'

const MOCK_LATENCY_MS = 550
const BID_LATENCY_MS = 450

function wait(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function euro(value: number): string {
  return `€${roundMoney(value).toFixed(2)}`
}

export const auctionRoomMockService: AuctionRoomService = {
  async getAuction(id: string) {
    await wait()

    if (id === MOCK_AUCTION_ERROR_ID) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'This auction room could not be loaded. Please try again.',
      )
    }

    const room = getMockAuction(id)
    if (!room) {
      throw new ApiError(
        404,
        'AUCTION_NOT_FOUND',
        'We could not find this auction. It may have ended and been removed.',
      )
    }

    return room
  },

  async placeBid(id: string, amount: number, bidder: AuctionBidder): Promise<AuctionBidDto> {
    await wait(BID_LATENCY_MS)

    const room = getMockAuction(id)
    if (!room) {
      throw new ApiError(
        404,
        'AUCTION_NOT_FOUND',
        'We could not find this auction. It may have ended and been removed.',
      )
    }

    if (room.producer?.id && room.producer.id === bidder.id) {
      throw new ApiError(403, 'OWN_LOT', 'You cannot bid on your own lot.')
    }

    if (room.status !== 'active') {
      throw new ApiError(409, 'AUCTION_NOT_ACTIVE', 'Bidding has closed for this auction.')
    }

    if (room.endsAt && Date.parse(room.endsAt) <= Date.now()) {
      throw new ApiError(
        409,
        'AUCTION_CLOSED',
        'The clock has run out. Bids are no longer accepted.',
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid bid amount.', {
        amount: 'Enter a valid bid amount.',
      })
    }

    const currentPrice = roundMoney(room.currentPrice ?? 0)
    const increment = roundMoney(room.increment ?? 1)
    const minimum = roundMoney(currentPrice + increment)
    const value = roundMoney(amount)

    if (value < minimum) {
      throw new ApiError(
        409,
        'BID_TOO_LOW',
        `The minimum bid is ${euro(minimum)}. The current price is ${euro(currentPrice)}.`,
      )
    }

    const sequence = (room.bids?.length ?? 0) + 1

    if (id === MOCK_AUCTION_RACE_ID) {
      // A rival bid at the same amount wins the race first, then this bid is refused.
      const rival: AuctionBidDto = {
        id: `bid-${id}-rival-${sequence}`,
        amount: value,
        name: 'Marta Nunes',
        bidderId: 'buyer-marta',
        date: new Date().toISOString(),
      }
      addMockBid(id, rival, { id: 'buyer-marta', name: 'Marta Nunes' })
      const message = `Another bid of ${euro(value)} arrived first. The minimum bid is now ${euro(
        value + increment,
      )}.`
      emitMockBidRejected(id, bidder.id, value, 'BID_OUTBID', message)
      throw new ApiError(409, 'BID_OUTBID', message)
    }

    const bid: AuctionBidDto = {
      id: `bid-${id}-you-${sequence}`,
      amount: value,
      name: bidder.name,
      bidderId: bidder.id,
      date: new Date().toISOString(),
    }
    addMockBid(id, bid, { id: bidder.id, name: bidder.name })

    return bid
  },
}

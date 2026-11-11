import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { round2 } from '../../lib/money.js'
import { emitToAuction, emitToUser } from '../../realtime/emit.js'
import { UserModel, type UserRole } from '../users/users.model.js'
import type { AuctionBidDto } from './auctions.service.js'
import {
  AuctionModel,
  type AuctionDoc,
  type PublicAuctionStatus,
} from './auctions.model.js'
import { BidModel, type BidDoc } from './bids.model.js'
import type { PlaceBidInput } from './bids.schemas.js'

type AuctionRow = AuctionDoc & { _id: mongoose.Types.ObjectId }
type BidRow = BidDoc & { _id: mongoose.Types.ObjectId }

interface Bidder {
  id: string
  role: UserRole
}

const iso = (date: Date): string => new Date(date).toISOString()

function toBidDto(bid: BidRow): AuctionBidDto {
  return {
    id: String(bid._id),
    amount: bid.amount,
    name: bid.name,
    bidderId: String(bid.bidder),
    date: iso(bid.createdAt),
  }
}

// A lost race is reported to that bidder only; the room never sees the rejection.
function rejectOutbid(bidderId: string, auctionId: string, amount: number): never {
  const message = 'Another bid arrived first'
  emitToUser(bidderId, 'bid-rejected', {
    auctionId,
    bidderId,
    amount,
    code: 'BID_OUTBID',
    message,
  })
  throw new ApiError(409, 'BID_OUTBID', message)
}

export async function placeBid(bidder: Bidder, auctionId: string, input: PlaceBidInput): Promise<AuctionBidDto> {
  const auction: AuctionRow | null = mongoose.isValidObjectId(auctionId)
    ? await AuctionModel.findOne({ _id: auctionId })
        .select('producer status endsAt currentPrice increment')
        .lean()
    : null
  if (!auction) throw new ApiError(404, 'AUCTION_NOT_FOUND', 'Auction not found')

  if (bidder.role === 'producer' && String(auction.producer) === bidder.id) {
    throw new ApiError(403, 'OWN_LOT', 'A producer cannot bid on their own auction')
  }
  if (bidder.role !== 'buyer') throw new ApiError(403, 'FORBIDDEN', 'Only buyers can bid')

  if (auction.status !== 'active') throw new ApiError(409, 'AUCTION_NOT_ACTIVE', 'Auction is not active')

  const now = new Date()
  if (auction.endsAt.getTime() <= now.getTime()) {
    throw new ApiError(409, 'AUCTION_CLOSED', 'Auction has ended')
  }

  const amount = round2(input.amount)
  if (amount < round2(auction.currentPrice + auction.increment)) {
    throw new ApiError(409, 'BID_TOO_LOW', 'Bid is below the minimum next bid')
  }

  if (!mongoose.isValidObjectId(bidder.id)) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
  const user = await UserModel.findById(bidder.id).select('name').lean()
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
  const leader = { id: bidder.id, name: user.name }

  // The only place the price changes: one conditional update keeps racing bids apart.
  const updated: AuctionRow | null = await AuctionModel.findOneAndUpdate(
    {
      _id: auction._id,
      status: 'active',
      endsAt: { $gt: now },
      $expr: { $gte: [amount, { $add: ['$currentPrice', '$increment'] }] },
    },
    {
      $set: { currentPrice: amount, leader: { id: new mongoose.Types.ObjectId(bidder.id), name: user.name } },
      $inc: { bidCount: 1 },
    },
    { returnDocument: 'after' },
  ).lean()
  if (!updated) rejectOutbid(bidder.id, auctionId, amount)

  const bid = await BidModel.create({ auction: updated._id, bidder: leader.id, name: leader.name, amount })
  const dto = toBidDto(bid.toObject() as BidRow)

  emitToAuction(auctionId, 'bid-placed', {
    auctionId,
    bid: dto,
    currentPrice: updated.currentPrice,
    leader,
    endsAt: iso(updated.endsAt),
  })
  emitToAuction(auctionId, 'auction-updated', {
    auctionId,
    currentPrice: updated.currentPrice,
    bidCount: updated.bidCount,
    leader,
    endsAt: iso(updated.endsAt),
    status: updated.status as PublicAuctionStatus,
  })
  return dto
}

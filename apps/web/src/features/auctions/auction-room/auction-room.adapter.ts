import type {
  AuctionBidDto,
  AuctionEndedEventDto,
  AuctionLeaderDto,
  AuctionProducerDto,
  AuctionProductDto,
  AuctionRoomDto,
  BidPlacedEventDto,
  BidRejectedEventDto,
  ViewersEventDto,
} from './auction-room.dto'
import type {
  AuctionBid,
  AuctionEndedUpdate,
  AuctionLeader,
  AuctionProducer,
  AuctionProduct,
  AuctionRoom,
  AuctionStatus,
  BidPlacedUpdate,
  BidRejectedUpdate,
  ViewersUpdate,
} from './auction-room.types'

const AUCTION_STATUSES: AuctionStatus[] = ['scheduled', 'active', 'ended']

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return Number.isNaN(Date.parse(value)) ? null : value
}

function asStatus(value: unknown): AuctionStatus | null {
  return AUCTION_STATUSES.includes(value as AuctionStatus) ? (value as AuctionStatus) : null
}

function adaptProduct(dto: AuctionProductDto | string | null | undefined): AuctionProduct {
  if (typeof dto === 'string') {
    return { id: '', name: dto, category: 'other' }
  }
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Auction lot'),
    category: asString(dto?.category, 'other'),
  }
}

function adaptProducer(dto: AuctionProducerDto | null | undefined): AuctionProducer {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
  }
}

function adaptLeader(dto: AuctionLeaderDto | null | undefined): AuctionLeader | null {
  const id = asString(dto?.id || dto?._id)
  const name = asString(dto?.name)
  if (!id && !name) return null
  return { id: id || name, name: name || 'A bidder' }
}

export function adaptBid(dto: AuctionBidDto | null | undefined, index = 0): AuctionBid | null {
  const amount = roundMoney(asNumber(dto?.amount))
  if (amount <= 0) return null
  return {
    id: asString(dto?.id || dto?._id, `bid-${index + 1}`),
    amount,
    bidderId: asString(dto?.bidderId),
    bidderName: asString(dto?.name, 'A bidder'),
    date: asDate(dto?.date),
  }
}

function adaptBids(dto: AuctionBidDto[] | null | undefined): AuctionBid[] {
  if (!Array.isArray(dto)) return []
  const bids = dto
    .map((entry, index) => adaptBid(entry, index))
    .filter((bid): bid is AuctionBid => bid !== null)
  return bids.sort((left, right) => {
    const leftTime = left.date ? Date.parse(left.date) : Number.NEGATIVE_INFINITY
    const rightTime = right.date ? Date.parse(right.date) : Number.NEGATIVE_INFINITY
    return rightTime - leftTime
  })
}

export function adaptAuctionRoom(dto: AuctionRoomDto | null | undefined): AuctionRoom {
  const basePrice = roundMoney(asNumber(dto?.basePrice))
  const currentPrice = roundMoney(asNumber(dto?.currentPrice, basePrice))
  const product = adaptProduct(dto?.product)

  return {
    id: asString(dto?.id || dto?._id, 'auction'),
    status: asStatus(dto?.status) ?? 'active',
    product,
    producer: adaptProducer(dto?.producer),
    quantity: Math.max(0, Math.floor(asNumber(dto?.quantity))),
    unit: asString(dto?.unit, 'units'),
    basePrice,
    increment: roundMoney(asNumber(dto?.increment, 1)),
    currentPrice,
    leader: adaptLeader(dto?.leader),
    startsAt: asDate(dto?.startsAt),
    endsAt: asDate(dto?.endsAt),
    bids: adaptBids(dto?.bids),
    viewerCount: Math.max(0, Math.floor(asNumber(dto?.viewerCount))),
    winner: adaptLeader(dto?.winner),
  }
}

export function adaptBidPlaced(
  dto: BidPlacedEventDto | null | undefined,
): BidPlacedUpdate | null {
  const auctionId = asString(dto?.auctionId)
  const bid = adaptBid(dto?.bid)
  if (!auctionId || !bid) return null

  return {
    auctionId,
    bid,
    currentPrice: roundMoney(asNumber(dto?.currentPrice, bid.amount)),
    leader: adaptLeader(dto?.leader) ?? { id: bid.bidderId, name: bid.bidderName },
    endsAt: asDate(dto?.endsAt),
  }
}

export function adaptViewers(dto: ViewersEventDto | null | undefined): ViewersUpdate | null {
  const auctionId = asString(dto?.auctionId)
  if (!auctionId) return null
  return {
    auctionId,
    count: Math.max(0, Math.floor(asNumber(dto?.count))),
  }
}

export function adaptAuctionEnded(
  dto: AuctionEndedEventDto | null | undefined,
): AuctionEndedUpdate | null {
  const auctionId = asString(dto?.auctionId)
  if (!auctionId) return null
  return {
    auctionId,
    winner: adaptLeader(dto?.winner),
    currentPrice: roundMoney(asNumber(dto?.currentPrice)),
  }
}

export function adaptBidRejected(
  dto: BidRejectedEventDto | null | undefined,
): BidRejectedUpdate | null {
  const auctionId = asString(dto?.auctionId)
  const bidderId = asString(dto?.bidderId)
  if (!auctionId || !bidderId) return null

  return {
    auctionId,
    bidderId,
    amount: dto?.amount === undefined ? null : roundMoney(asNumber(dto.amount)),
    code: asString(dto?.code, 'BID_REJECTED'),
    message: asString(
      dto?.message,
      'Another bid arrived first. Check the current price and try again.',
    ),
  }
}

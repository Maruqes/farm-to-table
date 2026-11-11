import type {
  ProducerAuctionDto,
  ProducerAuctionLeaderDto,
  ProducerAuctionProductDto,
} from './producer-auctions.dto'
import type {
  AuctionLeader,
  AuctionProduct,
  AuctionStatus,
  ProducerAuction,
} from './producer-auctions.types'

const AUCTION_STATUSES: AuctionStatus[] = ['draft', 'scheduled', 'active', 'ended']

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function asInteger(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(asNumber(value, fallback)))
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return Number.isNaN(Date.parse(value)) ? null : value
}

function asStatus(value: unknown): AuctionStatus | null {
  return AUCTION_STATUSES.includes(value as AuctionStatus) ? (value as AuctionStatus) : null
}

function adaptProduct(
  dto: ProducerAuctionProductDto | string | null | undefined,
): AuctionProduct {
  if (typeof dto === 'string') {
    return { id: '', name: dto, category: 'vegetables' }
  }
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Auction lot'),
    category: asString(dto?.category, 'vegetables'),
  }
}

function adaptLeader(
  dto: ProducerAuctionLeaderDto | null | undefined,
): AuctionLeader | null {
  const id = asString(dto?.id || dto?._id)
  const name = asString(dto?.name)
  if (!id && !name) return null
  return { id: id || name, name: name || 'A bidder' }
}

function durationFromDates(startsAt: string | null, endsAt: string | null): number | null {
  if (!startsAt || !endsAt) return null
  const start = Date.parse(startsAt)
  const end = Date.parse(endsAt)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  return Math.max(1, Math.round((end - start) / 60_000))
}

function addMinutes(iso: string, minutes: number): string | null {
  const start = Date.parse(iso)
  if (Number.isNaN(start)) return null
  return new Date(start + minutes * 60_000).toISOString()
}

export function adaptProducerAuction(
  dto: ProducerAuctionDto | null | undefined,
  index = 0,
): ProducerAuction {
  const productDto = dto?.product
  const product = adaptProduct(productDto)
  const unit =
    asString(dto?.unit) ||
    asString(typeof productDto === 'object' ? productDto?.unit : '') ||
    'units'
  const basePrice = roundMoney(asNumber(dto?.basePrice))
  const startsAt = asDate(dto?.startsAt)
  const endsAt = asDate(dto?.endsAt)
  const durationMinutes =
    asInteger(dto?.durationMinutes) ||
    durationFromDates(startsAt, endsAt) ||
    30
  const computedEndsAt =
    endsAt ?? (startsAt ? addMinutes(startsAt, durationMinutes) : null)

  return {
    id: asString(dto?.id || dto?._id, `auction-${index + 1}`),
    status: asStatus(dto?.status) ?? 'draft',
    product,
    quantity: Math.max(1, asInteger(dto?.quantity, 1)),
    unit,
    basePrice,
    increment: roundMoney(asNumber(dto?.increment, 1)),
    durationMinutes,
    startsAt,
    endsAt: computedEndsAt,
    currentPrice: roundMoney(asNumber(dto?.currentPrice, basePrice)),
    bidCount: asInteger(dto?.bidCount),
    leader: adaptLeader(dto?.leader),
    createdAt: asDate(dto?.createdAt),
  }
}

export function adaptProducerAuctions(
  dto: ProducerAuctionDto[] | null | undefined,
): ProducerAuction[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((auction, index) => adaptProducerAuction(auction, index))
}

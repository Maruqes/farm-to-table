import type {
  AdminAuctionDto,
  AdminAuctionProducerDto,
  AdminAuctionProductDto,
  AdminAuctionsPageDto,
} from './admin-auctions.dto'
import { AUCTION_STATUS_LABELS } from './admin-auctions.labels'
import type {
  AdminAuction,
  AdminAuctionStatus,
  AdminAuctionsPage,
} from './admin-auctions.types'

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

function asStatus(value: unknown): AdminAuctionStatus {
  const status = asString(value).toLowerCase()
  return Object.prototype.hasOwnProperty.call(AUCTION_STATUS_LABELS, status)
    ? (status as AdminAuctionStatus)
    : 'draft'
}

function asProductName(
  product: AdminAuctionProductDto | string | null | undefined,
  fallback = 'Auction lot',
): string {
  if (typeof product === 'string') return asString(product, fallback)
  if (product && typeof product === 'object') return asString(product.name, fallback)
  return fallback
}

function asProducerName(
  producer: AdminAuctionProducerDto | string | null | undefined,
  fallback = 'Unknown producer',
): string {
  if (typeof producer === 'string') return asString(producer, fallback)
  if (producer && typeof producer === 'object') return asString(producer.name, fallback)
  return fallback
}

export function adaptAdminAuction(
  dto: AdminAuctionDto | null | undefined,
  index = 0,
): AdminAuction {
  return {
    id: asString(dto?.id || dto?._id, `auction-${index + 1}`),
    productName:
      asString(dto?.productName) || asProductName(dto?.product),
    producerName:
      asString(dto?.producerName) || asProducerName(dto?.producer),
    status: asStatus(dto?.status),
    currentPrice: roundMoney(asNumber(dto?.currentPrice)),
    bidCount: asInteger(dto?.bidCount),
    startsAt: asDate(dto?.startsAt),
    endsAt: asDate(dto?.endsAt),
  }
}

export function adaptAdminAuctionsPage(
  dto: AdminAuctionsPageDto | null | undefined,
): AdminAuctionsPage {
  const raw = Array.isArray(dto?.items) ? dto.items : []
  const items = raw.map((auction, index) => adaptAdminAuction(auction, index))
  const reportedTotal =
    typeof dto?.total === 'number' && Number.isFinite(dto.total)
      ? Math.floor(dto.total)
      : items.length

  return {
    items,
    total: Math.max(items.length, reportedTotal, 0),
  }
}

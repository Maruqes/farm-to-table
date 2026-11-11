import type { AuctionListItemDto } from './auctions-list.dto'
import {
  AUCTION_LIST_STATUSES,
  type AuctionListItem,
  type AuctionListStatus,
} from './auctions-list.types'

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

function asStatus(value: unknown): AuctionListStatus {
  return AUCTION_LIST_STATUSES.includes(value as AuctionListStatus)
    ? (value as AuctionListStatus)
    : 'active'
}

export function adaptAuctionListItem(
  dto: AuctionListItemDto | null | undefined,
): AuctionListItem {
  const product = dto?.product
  const isProductName = typeof product === 'string'

  return {
    id: asString(dto?.id || dto?._id),
    productId: isProductName ? '' : asString(product?.id || product?._id),
    productName: isProductName
      ? asString(product, 'Auction lot')
      : asString(product?.name, 'Auction lot'),
    category: isProductName ? 'other' : asString(product?.category, 'other'),
    currentPrice: roundMoney(asNumber(dto?.currentPrice)),
    endsAt: asDate(dto?.endsAt),
    viewers: Math.max(0, Math.floor(asNumber(dto?.viewers, asNumber(dto?.viewerCount)))),
    status: asStatus(dto?.status),
  }
}

export function adaptAuctionsList(
  dtos: AuctionListItemDto[] | null | undefined,
): AuctionListItem[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(adaptAuctionListItem).filter((auction) => auction.id !== '')
}

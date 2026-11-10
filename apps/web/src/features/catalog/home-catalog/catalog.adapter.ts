import type {
  AuctionSummaryDto,
  ProductDto,
  ProducerSummaryDto,
} from './catalog.dto'
import type { LiveAuction, Product, ProducerSummary } from './catalog.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function adaptProducer(dto: ProducerSummaryDto | null | undefined): ProducerSummary {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
  }
}

export function adaptProduct(dto: ProductDto | null | undefined): Product {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Unnamed product'),
    price: asNumber(dto?.price),
    unit: asString(dto?.unit, 'unit'),
    stock: Math.max(0, asNumber(dto?.stock)),
    category: asString(dto?.category, 'other'),
    imageUrl: asString(dto?.imageUrl),
    producer: adaptProducer(dto?.producer),
    averageRating: Math.min(5, Math.max(0, asNumber(dto?.averageRating))),
  }
}

export function adaptLiveAuction(dto: AuctionSummaryDto | null | undefined): LiveAuction {
  const product = dto?.product
  const productId =
    typeof product === 'string'
      ? product
      : asString(product?.id || product?._id)
  const productName =
    typeof product === 'string' ? product : asString(product?.name, 'Auction lot')

  return {
    id: asString(dto?.id || dto?._id),
    productId,
    productName,
    category: typeof product === 'string' ? 'other' : asString(product?.category, 'other'),
    currentPrice: asNumber(dto?.currentPrice),
    endsAt: asString(dto?.endsAt),
  }
}

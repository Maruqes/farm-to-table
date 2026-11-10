import type {
  MyOrderDto,
  MyOrderHistoryDto,
  MyOrderItemDto,
  MyOrderProducerDto,
  MyOrderReviewDto,
  OrderUpdatedEventDto,
} from './my-orders.dto'
import type {
  MyOrder,
  OrderLine,
  OrderProducer,
  OrderRating,
  OrderStatus,
  OrderStatusUpdate,
  OrderTimelineEntry,
} from './my-orders.types'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'ready', 'delivered']

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

function asStatus(value: unknown): OrderStatus | null {
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : null
}

function asCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

function asRating(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rating = Math.round(value)
  return rating >= 1 && rating <= 5 ? rating : null
}

function adaptHistory(value: MyOrderHistoryDto[] | null | undefined): OrderTimelineEntry[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<OrderStatus>()
  const history: OrderTimelineEntry[] = []
  for (const entry of value) {
    const status = asStatus(entry?.status)
    if (!status || seen.has(status)) continue
    seen.add(status)
    history.push({ status, date: asDate(entry?.date) })
  }
  return history
}

function adaptProducer(dto: MyOrderProducerDto | null | undefined): OrderProducer {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
    email: asString(dto?.email),
    phone: asString(dto?.phone),
    lat: asCoordinate(dto?.lat, -90, 90),
    lng: asCoordinate(dto?.lng, -180, 180),
  }
}

function adaptItem(dto: MyOrderItemDto | null | undefined, index: number): OrderLine {
  return {
    productId: asString(dto?.productId || dto?.id || dto?._id, `item-${index}`),
    name: asString(dto?.name, 'Unnamed product'),
    price: roundMoney(asNumber(dto?.price)),
    quantity: Math.max(1, Math.floor(asNumber(dto?.quantity, 1))),
    unit: asString(dto?.unit, 'unit'),
  }
}

function adaptReview(dto: MyOrderDto): OrderRating | null {
  const reviewDto: MyOrderReviewDto | null | undefined = dto.review
  const rating = asRating(reviewDto?.rating ?? dto.rating)
  if (rating === null) return null
  return {
    rating,
    text: asString(reviewDto?.text ?? dto.text),
  }
}

export function adaptMyOrder(dto: MyOrderDto, index = 0): MyOrder {
  const items = (Array.isArray(dto?.items) ? dto.items : []).map(adaptItem)
  const computedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const total =
    typeof dto?.total === 'number' && Number.isFinite(dto.total)
      ? roundMoney(dto.total)
      : roundMoney(computedTotal)
  const review = adaptReview(dto ?? {})

  return {
    id: asString(dto?.id || dto?._id, `order-${index + 1}`),
    status: asStatus(dto?.status) ?? 'pending',
    history: adaptHistory(dto?.history),
    producer: adaptProducer(dto?.producer),
    items,
    total,
    reviewed: dto?.reviewed === true || review !== null,
    review,
  }
}

export function adaptMyOrders(dto: MyOrderDto[] | null | undefined): MyOrder[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((order, index) => adaptMyOrder(order, index))
}

export function adaptOrderUpdated(
  dto: OrderUpdatedEventDto | null | undefined,
): OrderStatusUpdate | null {
  const orderId = asString(dto?.orderId)
  const status = asStatus(dto?.status)
  if (!orderId || !status) return null
  return { orderId, status, updatedAt: asDate(dto?.updatedAt) }
}

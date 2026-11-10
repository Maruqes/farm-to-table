import type { OrderDto, OrderItemDto, OrderProducerDto } from './checkout.dto'
import type {
  OrderLine,
  OrderProducer,
  OrderStatus,
  PlacedOrder,
} from './checkout.types'

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

function adaptStatus(value: unknown): OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : 'pending'
}

function adaptProducer(dto: OrderProducerDto | null | undefined): OrderProducer {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
  }
}

function adaptItem(dto: OrderItemDto | null | undefined, index: number): OrderLine {
  return {
    productId: asString(dto?.productId || dto?.id || dto?._id, `item-${index}`),
    name: asString(dto?.name, 'Unnamed product'),
    price: roundMoney(asNumber(dto?.price)),
    quantity: Math.max(1, Math.floor(asNumber(dto?.quantity, 1))),
    unit: asString(dto?.unit, 'unit'),
  }
}

export function adaptPlacedOrders(
  dto: OrderDto[] | null | undefined,
): PlacedOrder[] {
  const raw = Array.isArray(dto) ? dto : []

  return raw.map((order, index) => {
    const items = (Array.isArray(order?.items) ? order.items : []).map(adaptItem)
    const computedTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    const total =
      typeof order?.total === 'number' && Number.isFinite(order.total)
        ? roundMoney(order.total)
        : roundMoney(computedTotal)

    return {
      id: asString(order?.id || order?._id, `order-${index + 1}`),
      producer: adaptProducer(order?.producer),
      status: adaptStatus(order?.status),
      items,
      total,
    }
  })
}

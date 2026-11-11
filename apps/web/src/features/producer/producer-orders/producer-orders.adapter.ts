import type {
  OrderCreatedEventDto,
  OrderStatusUpdatedEventDto,
  ProducerOrderDto,
} from './producer-orders.dto'
import type {
  FulfilmentMethod,
  OrderBuyer,
  OrderFulfilment,
  OrderLine,
  OrderStatus,
  OrderStatusUpdate,
  ProducerOrder,
} from './producer-orders.types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
  'cancelled',
]

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

function asFulfilment(value: unknown): FulfilmentMethod {
  return value === 'delivery' ? 'delivery' : 'pickup'
}

// CT-07 address object, shown as "line1, postalCode city".
function formatAddress(dto: ProducerOrderDto['address']): string {
  const line1 = asString(dto?.line1)
  const cityLine = [asString(dto?.postalCode), asString(dto?.city)]
    .filter(Boolean)
    .join(' ')
  return [line1, cityLine].filter(Boolean).join(', ')
}

function adaptBuyer(dto: ProducerOrderDto['buyer']): OrderBuyer {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Buyer'),
    email: asString(dto?.email),
    phone: asString(dto?.phone),
  }
}

function adaptItem(
  dto: NonNullable<ProducerOrderDto['items']>[number] | null | undefined,
  index: number,
): OrderLine {
  return {
    productId: asString(dto?.productId || dto?.id || dto?._id, `item-${index}`),
    name: asString(dto?.name, 'Unnamed product'),
    price: roundMoney(asNumber(dto?.price)),
    quantity: Math.max(1, Math.floor(asNumber(dto?.quantity, 1))),
    unit: asString(dto?.unit, 'unit'),
  }
}

function adaptFulfilment(dto: ProducerOrderDto): OrderFulfilment {
  return {
    method: asFulfilment(dto?.fulfilment),
    address: formatAddress(dto?.address),
  }
}

export function adaptProducerOrder(dto: ProducerOrderDto, index = 0): ProducerOrder {
  const items = (Array.isArray(dto?.items) ? dto.items : []).map(adaptItem)
  const computedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const total =
    typeof dto?.total === 'number' && Number.isFinite(dto.total)
      ? roundMoney(dto.total)
      : roundMoney(computedTotal)

  return {
    id: asString(dto?.id || dto?._id, `order-${index + 1}`),
    status: asStatus(dto?.status) ?? 'pending',
    createdAt: asDate(dto?.createdAt),
    buyer: adaptBuyer(dto?.buyer),
    items,
    total,
    fulfilment: adaptFulfilment(dto),
  }
}

export function adaptProducerOrders(
  dto: ProducerOrderDto[] | null | undefined,
): ProducerOrder[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((order, index) => adaptProducerOrder(order, index))
}

export function adaptOrderStatusUpdate(
  dto: OrderStatusUpdatedEventDto | null | undefined,
): OrderStatusUpdate | null {
  const orderId = asString(dto?.orderId)
  const status = asStatus(dto?.status)
  if (!orderId || !status) return null
  return { orderId, status, updatedAt: asDate(dto?.updatedAt) }
}

export function adaptOrderCreated(
  dto: OrderCreatedEventDto | null | undefined,
): ProducerOrder | null {
  const order = dto?.order ?? dto
  if (!order || !asString(order.id || order._id)) return null
  return adaptProducerOrder(order)
}

import type { CartItemDto } from '../../cart/cart.dto'
import type { OrderDto, OrderItemDto, OrderProducerDto } from '../checkout.dto'

interface OrderGroup {
  producer: OrderProducerDto
  items: CartItemDto[]
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function producerKey(producer: OrderProducerDto): string {
  return asString(producer.id || producer.name, 'unknown-producer')
}

function toOrderItem(item: CartItemDto): OrderItemDto {
  return {
    productId: asString(item.productId || item.id || item._id),
    name: asString(item.name, 'Unnamed product'),
    price: roundMoney(asNumber(item.price)),
    quantity: Math.max(1, Math.floor(asNumber(item.quantity, 1))),
    unit: asString(item.unit, 'unit'),
  }
}

// Checkout splits the cart into one order per producer, as SCOPE.md §0 requires.
export function buildOrderDtos(
  userId: string,
  items: CartItemDto[],
): OrderDto[] {
  const groups = new Map<string, OrderGroup>()

  for (const item of items) {
    const producer: OrderProducerDto = {
      id: asString(item.producer?.id || item.producer?._id),
      name: asString(item.producer?.name, 'Local producer'),
      location: asString(item.producer?.location),
    }
    const key = producerKey(producer)
    const group = groups.get(key)
    if (group) {
      group.items.push(item)
      continue
    }
    groups.set(key, { producer, items: [item] })
  }

  return [...groups.values()].map((group, index) => {
    const orderItems = group.items.map(toOrderItem)
    return {
      id: `order-${userId}-${index + 1}`,
      producer: group.producer,
      status: 'pending',
      items: orderItems,
      total: roundMoney(
        orderItems.reduce(
          (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0),
          0,
        ),
      ),
    }
  })
}

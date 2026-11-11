import type { CartDto, CartItemDto, CartProducerDto } from './cart.dto'
import type { Cart, CartItem, CartProducer } from './cart.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function adaptProducer(dto: CartProducerDto | null | undefined): CartProducer {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
  }
}

function adaptItem(dto: CartItemDto | null | undefined, index: number): CartItem {
  const stock = Math.max(0, Math.floor(asNumber(dto?.stock)))
  const quantity = Math.max(1, Math.floor(asNumber(dto?.quantity, 1)))

  return {
    productId: asString(dto?.productId || dto?.id || dto?._id, `item-${index}`),
    name: asString(dto?.name, 'Unnamed product'),
    price: Math.max(0, asNumber(dto?.price)),
    quantity: stock > 0 ? Math.min(quantity, stock) : quantity,
    unit: asString(dto?.unit, 'unit'),
    stock,
    category: asString(dto?.category, 'other'),
    imageUrl: asString(dto?.imageUrl),
    producer: adaptProducer(dto?.producer),
  }
}

export function adaptCart(dto: CartDto | null | undefined): Cart {
  const raw = Array.isArray(dto?.items) ? dto.items : []
  const merged = new Map<string, CartItem>()

  raw.map(adaptItem).forEach((item) => {
    const existing = merged.get(item.productId)
    if (!existing) {
      merged.set(item.productId, item)
      return
    }
    // One line per product; cap a merged quantity at the available stock.
    const cap = existing.stock > 0 ? existing.stock : existing.quantity + item.quantity
    merged.set(item.productId, {
      ...existing,
      quantity: Math.min(existing.quantity + item.quantity, cap),
    })
  })

  return { items: [...merged.values()] }
}

import type { CartGroup, CartItem } from './cart.types'

export function groupCartByProducer(items: CartItem[]): CartGroup[] {
  const groups = new Map<string, CartGroup>()

  for (const item of items) {
    const key = item.producer.id || item.producer.name
    const group = groups.get(key)
    if (group) {
      group.items.push(item)
      group.subtotal += item.price * item.quantity
      continue
    }
    groups.set(key, {
      producer: item.producer,
      items: [item],
      subtotal: item.price * item.quantity,
    })
  }

  return [...groups.values()]
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function cartUnitCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { publicProducerName } from '../../lib/producer-name.js'
import { UserModel } from '../users/users.model.js'
import { findBuyable, imageUrl } from '../products/products.service.js'
import type { SaveCartInput } from './cart.schemas.js'

type Line = { product: unknown, quantity: number }

// Cart lines joined with current product data; lines whose product is gone or no longer buyable are dropped.
async function toLines(lines: Line[]) {
  if (!lines.length) return []
  const rows = await findBuyable({ productFilter: { _id: { $in: lines.map((l) => l.product) } } })
  const byId = new Map(rows.map((r) => [String(r.p._id), r]))
  return lines.flatMap((l) => {
    const row = byId.get(String(l.product))
    if (!row) return []
    const { p, producer } = row
    return [{
      productId: String(p._id),
      name: p.name,
      price: p.price,
      quantity: l.quantity,
      unit: p.unit,
      stock: p.stock,
      category: p.category,
      ...imageUrl(p),
      producer: { id: String(producer._id), name: publicProducerName(producer), location: producer.producer?.location ?? '' },
    }]
  })
}

export async function getCartLines(userId: string) {
  const user = await UserModel.findById(userId).select('cart').lean()
  return toLines((user?.cart ?? []) as Line[])
}

export async function getCart(userId: string) {
  return { items: await getCartLines(userId) }
}

export async function saveCart(userId: string, input: SaveCartInput) {
  if (input.items.some((i) => !mongoose.isValidObjectId(i.productId))) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  const lines = await toLines(input.items.map((i) => ({ product: i.productId, quantity: i.quantity })))
  if (lines.length !== input.items.length) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  if (lines.some((l) => l.quantity > l.stock)) throw new ApiError(409, 'STOCK_CHANGED', 'Stock changed')
  await UserModel.updateOne({ _id: userId }, { $set: { cart: lines.map((l) => ({ product: l.productId, quantity: l.quantity })) } })
  return { items: lines }
}

export async function clearCart(userId: string): Promise<void> {
  await UserModel.updateOne({ _id: userId }, { $set: { cart: [] } })
}

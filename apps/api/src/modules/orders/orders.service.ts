import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { round2 } from '../../lib/money.js'
import { emitToUser } from '../../realtime/emit.js'
import { clearCart, getCartLines } from '../cart/cart.service.js'
import { notify } from '../notifications/notifications.service.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'
import { OrderModel, type Fulfilment, type OrderStatus } from './orders.model.js'
import type { CheckoutInput } from './orders.schemas.js'

export interface OrderItemDto {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
}

export interface OrderProducerDto {
  id: string
  name: string
  location: string
}

export interface OrderDto {
  id: string
  producer: OrderProducerDto
  status: OrderStatus
  items: OrderItemDto[]
  total: number
}

export interface MyOrderProducerDto extends OrderProducerDto {
  email?: string
  lat?: number
  lng?: number
}

export interface MyOrderDto {
  id: string
  status: OrderStatus
  history: { status: OrderStatus, date: string }[]
  producer: MyOrderProducerDto
  items: OrderItemDto[]
  total: number
  reviewed: boolean
}

export interface ProducerOrderDto {
  id: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  buyer: { id: string, name: string, email?: string }
  items: OrderItemDto[]
  total: number
  fulfilment: Fulfilment
  address: { line1: string, city: string, postalCode: string } | null
}

export interface CreateOrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
}

export interface CreateOrderInput {
  buyer: string
  producer: string
  items: CreateOrderItem[]
  fulfilment: Fulfilment
  address?: { line1: string, city: string, postalCode: string } | null
  auction?: string
}

interface OrderItemLike {
  productId: unknown
  name: string
  price: number
  quantity: number
  unit: string
}

interface OrderLike {
  _id: unknown
  buyer: unknown
  producer: unknown
  items: OrderItemLike[]
  total: number
  status: OrderStatus
  history: { status: OrderStatus, date: Date }[]
  fulfilment: Fulfilment
  address?: { line1: string, city: string, postalCode: string } | null
  createdAt: Date
  updatedAt: Date
}

type ProducerUser = {
  _id: unknown
  name: string
  email: string
  producer?: { location?: string, lat?: number, lng?: number }
}

type StockLine = { productId: string, quantity: number }

function toItem(item: OrderItemLike): OrderItemDto {
  return {
    productId: String(item.productId),
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    unit: item.unit,
  }
}

function toOrderDto(order: OrderLike, producer: OrderProducerDto): OrderDto {
  return {
    id: String(order._id),
    producer,
    status: order.status,
    items: order.items.map(toItem),
    total: order.total,
  }
}

function toMyOrderDto(order: OrderLike, producer: MyOrderProducerDto): MyOrderDto {
  return {
    id: String(order._id),
    status: order.status,
    history: order.history.map((h) => ({ status: h.status, date: new Date(h.date).toISOString() })),
    producer,
    items: order.items.map(toItem),
    total: order.total,
    reviewed: false,
  }
}

function toProducerOrderDto(order: OrderLike, buyer: { _id: unknown, name: string, email?: string }): ProducerOrderDto {
  return {
    id: String(order._id),
    status: order.status,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
    buyer: { id: String(buyer._id), name: buyer.name, ...(buyer.email ? { email: buyer.email } : {}) },
    items: order.items.map(toItem),
    total: order.total,
    fulfilment: order.fulfilment,
    address:
      order.fulfilment === 'delivery' && order.address
        ? { line1: order.address.line1, city: order.address.city, postalCode: order.address.postalCode }
        : null,
  }
}

// One conditional update per line, so two buyers racing for the last unit cannot both win.
export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  const result = await ProductModel.updateOne({ _id: productId, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })
  return result.modifiedCount === 1
}

async function restoreStock(lines: StockLine[]): Promise<void> {
  await Promise.allSettled(lines.map((line) => ProductModel.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } })))
}

// Exported for BE-16 (auction winner order). It only persists; the caller handles its own notifications.
export async function createOrder(input: CreateOrderInput): Promise<OrderLike> {
  const total = round2(input.items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  return OrderModel.create({
    buyer: input.buyer,
    producer: input.producer,
    items: input.items.map((item) => ({
      productId: new mongoose.Types.ObjectId(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
    })),
    total,
    status: 'pending',
    history: [{ status: 'pending', date: new Date() }],
    fulfilment: input.fulfilment,
    address: input.fulfilment === 'delivery' ? (input.address ?? null) : null,
    ...(input.auction ? { auction: input.auction } : {}),
  })
}

export async function checkout(buyerId: string, input: CheckoutInput): Promise<OrderDto[]> {
  const buyer = await UserModel.findById(buyerId).select('cart name email').lean()
  if (!buyer) throw new ApiError(404, 'NOT_FOUND', 'User not found')
  if (!buyer.cart.length) throw new ApiError(400, 'VALIDATION_ERROR', 'Cart is empty')

  const lines = await getCartLines(buyerId)
  if (!lines.length) throw new ApiError(400, 'VALIDATION_ERROR', 'Cart is empty')

  const groups = new Map<string, { producer: OrderProducerDto, items: CreateOrderItem[] }>()
  for (const line of lines) {
    let group = groups.get(line.producer.id)
    if (!group) {
      group = { producer: line.producer, items: [] }
      groups.set(line.producer.id, group)
    }
    group.items.push({ productId: line.productId, name: line.name, price: line.price, quantity: line.quantity, unit: line.unit })
  }

  const reserved: StockLine[] = []
  for (const line of lines) {
    if (!(await decrementStock(line.productId, line.quantity))) {
      await restoreStock(reserved)
      throw new ApiError(409, 'STOCK_CHANGED', 'Stock changed')
    }
    reserved.push({ productId: line.productId, quantity: line.quantity })
  }

  const created: string[] = []
  try {
    const orders: OrderDto[] = []
    for (const group of groups.values()) {
      const order = await createOrder({
        buyer: buyerId,
        producer: group.producer.id,
        items: group.items,
        fulfilment: input.fulfilment,
        address: input.address,
      })
      created.push(String(order._id))
      orders.push(toOrderDto(order, group.producer))
      emitToUser(group.producer.id, 'order-created', toProducerOrderDto(order, buyer))
      await notify(group.producer.id, 'order-new', `New order from ${buyer.name}`)
    }
    await clearCart(buyerId)
    return orders
  } catch (err) {
    await restoreStock(reserved)
    if (created.length) await OrderModel.deleteMany({ _id: { $in: created } })
    throw err
  }
}

export async function listMyOrders(buyerId: string): Promise<MyOrderDto[]> {
  const orders: OrderLike[] = await OrderModel.find({ buyer: buyerId }).sort({ createdAt: -1, _id: -1 }).lean()
  if (!orders.length) return []
  const producers: ProducerUser[] = await UserModel.find({ _id: { $in: orders.map((o) => o.producer) } })
    .select('name email producer')
    .lean()
  const byId = new Map(producers.map((p) => [String(p._id), p]))
  return orders.map((order) => {
    const producer = byId.get(String(order.producer))
    const embedded = producer?.producer
    return toMyOrderDto(order, {
      id: producer ? String(producer._id) : String(order.producer),
      name: producer?.name ?? '',
      location: embedded?.location ?? '',
      ...(producer?.email ? { email: producer.email } : {}),
      ...(typeof embedded?.lat === 'number' && typeof embedded?.lng === 'number' ? { lat: embedded.lat, lng: embedded.lng } : {}),
    })
  })
}

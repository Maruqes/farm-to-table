import mongoose from 'mongoose'

export const ORDER_STATUSES = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type Fulfilment = 'pickup' | 'delivery'

export interface OrderItemEmbedded {
  productId: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
  unit: string
}

export interface OrderAddressEmbedded {
  line1: string
  city: string
  postalCode: string
}

export interface OrderHistoryEmbedded {
  status: OrderStatus
  date: Date
}

export interface OrderDoc {
  buyer: mongoose.Types.ObjectId
  producer: mongoose.Types.ObjectId
  items: OrderItemEmbedded[]
  total: number
  status: OrderStatus
  history: OrderHistoryEmbedded[]
  fulfilment: Fulfilment
  address?: OrderAddressEmbedded | null
  auction?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unit: { type: String, required: true },
  },
  { _id: false },
)

const orderAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
)

const orderHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    date: { type: Date, required: true },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    producer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', required: true },
    history: { type: [orderHistorySchema], default: [] },
    fulfilment: { type: String, enum: ['pickup', 'delivery'], required: true },
    address: { type: orderAddressSchema, default: null, required: false },
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: false },
  },
  { timestamps: true },
)

export const OrderModel = mongoose.model<OrderDoc>('Order', orderSchema)

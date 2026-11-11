import mongoose, { type Model } from 'mongoose'
import { escapeRegex } from '../../lib/escape-regex.js'
import { AuctionModel, type AuctionStatus } from '../auctions/auctions.model.js'
import { OrderModel, type OrderStatus } from '../orders/orders.model.js'
import { UserModel, type UserDoc, type UserRole } from '../users/users.model.js'
import type { AdminAuctionsQuery, AdminOrdersQuery, AdminUsersQuery } from './admin-lists.schemas.js'

export const ADMIN_PAGE_SIZE = 8

interface Page<T> {
  items: T[]
  total: number
}

async function paginate<TDoc, TLean>(
  model: Model<TDoc>,
  filter: mongoose.QueryFilter<TDoc>,
  sort: Record<string, 1 | -1>,
  page: number,
): Promise<Page<TLean>> {
  const skip = (page - 1) * ADMIN_PAGE_SIZE
  const [total, items] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter).sort(sort).skip(skip).limit(ADMIN_PAGE_SIZE).lean<TLean[]>(),
  ])
  return { items, total }
}

export interface AdminUserDto {
  id: string
  name: string
  email: string
  role: UserRole
  state: 'active' | 'pending'
}

type UserRow = {
  _id: unknown
  name: string
  email: string
  role: UserRole
  producer?: { status?: string }
}

function toAdminUserDto(user: UserRow): AdminUserDto {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    state: user.role === 'producer' && user.producer?.status === 'pending' ? 'pending' : 'active',
  }
}

export async function listAdminUsers(query: AdminUsersQuery): Promise<Page<AdminUserDto>> {
  const filter: mongoose.QueryFilter<UserDoc> = {}
  if (query.role) filter.role = query.role
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i')
    filter.$or = [{ name: pattern }, { email: pattern }]
  }
  const { items, total } = await paginate<UserDoc, UserRow>(UserModel, filter, { _id: -1 }, query.page)
  return { items: items.map(toAdminUserDto), total }
}

export interface AdminOrderDto {
  id: string
  buyerName: string
  producerName: string
  itemCount: number
  total: number
  status: OrderStatus
  createdAt: string
}

type OrderRow = {
  _id: unknown
  buyer: unknown
  producer: unknown
  items: { length: number }
  total: number
  status: OrderStatus
  createdAt: Date
}

type NamedUser = { _id: unknown, name: string, producer?: { farmName?: string } }

export async function listAdminOrders(query: AdminOrdersQuery): Promise<Page<AdminOrderDto>> {
  const filter: mongoose.QueryFilter<{ status: OrderStatus }> = {}
  if (query.status) filter.status = query.status
  const { items, total } = await paginate(OrderModel, filter, { createdAt: -1, _id: -1 }, query.page)
  const rows = items as unknown as OrderRow[]
  const ids = [...new Set([...rows.map((o) => String(o.buyer)), ...rows.map((o) => String(o.producer))])]
  const users: NamedUser[] = ids.length
    ? await UserModel.find({ _id: { $in: ids } }).select('name producer').lean<NamedUser[]>()
    : []
  const byId = new Map(users.map((u) => [String(u._id), u]))
  return {
    total,
    items: rows.map((order) => {
      const buyer = byId.get(String(order.buyer))
      const producer = byId.get(String(order.producer))
      return {
        id: String(order._id),
        buyerName: buyer?.name ?? '',
        producerName: producer?.producer?.farmName ?? producer?.name ?? '',
        itemCount: order.items.length,
        total: order.total,
        status: order.status,
        createdAt: new Date(order.createdAt).toISOString(),
      }
    }),
  }
}

export interface AdminAuctionDto {
  id: string
  status: AuctionStatus
  product: { id: string, name: string, category?: string }
  producer: { id: string, name: string }
  currentPrice: number
  bidCount: number
  startsAt: string | null
  endsAt: string | null
}

type AuctionRow = {
  _id: unknown
  status: AuctionStatus
  producer: unknown
  product: unknown
  productName: string
  category: string
  currentPrice: number
  bidCount: number
  startsAt: Date | null
  endsAt: Date | null
}

const isoOrNull = (date: Date | null | undefined): string | null =>
  date ? new Date(date).toISOString() : null

export async function listAdminAuctions(query: AdminAuctionsQuery): Promise<Page<AdminAuctionDto>> {
  const filter: mongoose.QueryFilter<{ status: AuctionStatus }> = {}
  if (query.status) filter.status = query.status
  const { items, total } = await paginate(AuctionModel, filter, { createdAt: -1, _id: -1 }, query.page)
  const rows = items as unknown as AuctionRow[]
  const ids = [...new Set(rows.map((a) => String(a.producer)))]
  const producers: NamedUser[] = ids.length
    ? await UserModel.find({ _id: { $in: ids } }).select('name producer').lean<NamedUser[]>()
    : []
  const byId = new Map(producers.map((p) => [String(p._id), p]))
  return {
    total,
    items: rows.map((auction) => {
      const producer = byId.get(String(auction.producer))
      return {
        id: String(auction._id),
        status: auction.status,
        product: { id: String(auction.product), name: auction.productName, category: auction.category },
        producer: {
          id: String(auction.producer),
          name: producer?.producer?.farmName ?? producer?.name ?? '',
        },
        currentPrice: auction.currentPrice,
        bidCount: auction.bidCount,
        startsAt: isoOrNull(auction.startsAt),
        endsAt: isoOrNull(auction.endsAt),
      }
    }),
  }
}

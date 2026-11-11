import mongoose from 'mongoose'
import { LOCAL_TIME_ZONE, localDayStart, recentLocalDays } from '../../lib/days.js'
import { round2 } from '../../lib/money.js'
import { viewerCount } from '../../realtime/emit.js'
import { AuctionModel } from '../auctions/auctions.model.js'
import { OrderModel, type OrderStatus } from '../orders/orders.model.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'

export const LOW_STOCK_THRESHOLD = 5
const LOW_STOCK_LIMIT = 20
const WINDOW_DAYS = 7

type DashboardOrderStatus = Exclude<OrderStatus, 'cancelled'>

export interface ActiveAuctionStats {
  id: string
  product: { id: string, name: string }
  currentPrice: number
  bidCount: number
  viewers: number
}

export interface ProducerStatsDto {
  sales: number
  toHandle: number
  activeProducts: number
  averageRating: number
  salesPerDay: { day: string, total: number }[]
  byStatus: Record<DashboardOrderStatus, number>
  lowStock: { productId: string, name: string, stock: number }[]
  activeAuction: ActiveAuctionStats | null
}

type OrderDayRow = { _id: string, total: number }
type OrderStatusRow = { _id: OrderStatus, count: number }
type StatsProducer = { producer?: { averageRating?: number, hidden?: boolean } }
type StatsProduct = { _id: unknown, name: string, stock: number }
type StatsAuction = { _id: unknown, product: unknown, productName: string, currentPrice: number, bidCount: number }

function emptyByStatus(): Record<DashboardOrderStatus, number> {
  return { pending: 0, confirmed: 0, ready: 0, delivered: 0 }
}

function toLowStockItem(product: StatsProduct): ProducerStatsDto['lowStock'][number] {
  return {
    productId: String(product._id),
    name: product.name,
    stock: product.stock,
  }
}

function toActiveAuction(auction: StatsAuction | null): ActiveAuctionStats | null {
  if (!auction) return null
  return {
    id: String(auction._id),
    product: { id: String(auction.product), name: auction.productName },
    currentPrice: auction.currentPrice,
    bidCount: auction.bidCount,
    viewers: viewerCount(String(auction._id)),
  }
}

function toStatsDto(input: {
  averageRating: number
  activeProducts: number
  salesPerDay: { day: string, total: number }[]
  byStatus: Record<DashboardOrderStatus, number>
  lowStock: ProducerStatsDto['lowStock']
  activeAuction: ActiveAuctionStats | null
}): ProducerStatsDto {
  return {
    sales: round2(input.salesPerDay.reduce((sum, point) => sum + point.total, 0)),
    toHandle: input.byStatus.pending + input.byStatus.confirmed,
    activeProducts: input.activeProducts,
    averageRating: input.averageRating,
    salesPerDay: input.salesPerDay,
    byStatus: input.byStatus,
    lowStock: input.lowStock,
    activeAuction: input.activeAuction,
  }
}

export async function getProducerStats(producerId: string): Promise<ProducerStatsDto> {
  const now = new Date()
  const days = recentLocalDays(WINDOW_DAYS, now)
  const windowStart = localDayStart(days[0]!)
  const producerObjectId = new mongoose.Types.ObjectId(producerId)

  const [producer, orderDays, orderStatuses, buyableProducts, lowStockProducts, auction] = await Promise.all([
    UserModel.findById(producerId).select('producer').lean<StatsProducer>(),
    OrderModel.aggregate<OrderDayRow>([
      {
        $match: {
          producer: producerObjectId,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: windowStart, $lte: now },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: LOCAL_TIME_ZONE } },
          total: { $sum: '$total' },
        },
      },
    ]),
    OrderModel.aggregate<OrderStatusRow>([
      { $match: { producer: producerObjectId, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ProductModel.countDocuments({ producer: producerId, hidden: { $ne: true }, stock: { $gt: 0 } }),
    ProductModel.find({ producer: producerId, hidden: { $ne: true }, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, name: 1, _id: 1 })
      .limit(LOW_STOCK_LIMIT)
      .select('name stock')
      .lean<StatsProduct[]>(),
    AuctionModel.findOne({ producer: producerId, status: 'active' })
      .sort({ endsAt: 1, _id: 1 })
      .select('product productName currentPrice bidCount')
      .lean<StatsAuction>(),
  ])

  const totalsByDay = new Map(orderDays.map((row) => [row._id, row.total]))
  const salesPerDay = days.map((day) => ({ day, total: round2(totalsByDay.get(day) ?? 0) }))

  const byStatus = emptyByStatus()
  for (const row of orderStatuses) {
    if (row._id !== 'cancelled') byStatus[row._id] = row.count
  }

  return toStatsDto({
    averageRating: round2(producer?.producer?.averageRating ?? 0),
    activeProducts: producer?.producer?.hidden === true ? 0 : buyableProducts,
    salesPerDay,
    byStatus,
    lowStock: lowStockProducts.map(toLowStockItem),
    activeAuction: toActiveAuction(auction),
  })
}

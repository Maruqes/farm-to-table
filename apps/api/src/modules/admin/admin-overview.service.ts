import { LOCAL_TIME_ZONE, localDayStart, recentLocalDays } from '../../lib/days.js'
import { round2 } from '../../lib/money.js'
import { AuctionModel } from '../auctions/auctions.model.js'
import { OrderModel } from '../orders/orders.model.js'
import { UserModel } from '../users/users.model.js'

const WINDOW_DAYS = 7

export interface AdminSummaryDto {
  users: number
  orders: number
  activeAuctions: number
  pendingProducers: number
  byStatus: { pending: number, confirmed: number, ready: number, delivered: number }
  salesPerDay: { date: string, total: number }[]
}

type StatusRow = { _id: string, count: number }
type DayRow = { _id: string, total: number }

export async function getAdminSummary(): Promise<AdminSummaryDto> {
  const now = new Date()
  const days = recentLocalDays(WINDOW_DAYS, now)
  const windowStart = localDayStart(days[0]!)

  const [users, orders, activeAuctions, pendingProducers, statusRows, dayRows] = await Promise.all([
    UserModel.countDocuments({ role: { $in: ['buyer', 'producer'] } }),
    OrderModel.countDocuments({}),
    AuctionModel.countDocuments({ status: 'active', cancelled: { $ne: true } }),
    UserModel.countDocuments({ role: 'producer', 'producer.status': 'pending' }),
    OrderModel.aggregate<StatusRow>([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<DayRow>([
      {
        $match: {
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
  ])

  const byStatus: AdminSummaryDto['byStatus'] = { pending: 0, confirmed: 0, ready: 0, delivered: 0 }
  for (const row of statusRows) {
    if (row._id === 'pending' || row._id === 'confirmed' || row._id === 'ready' || row._id === 'delivered') {
      byStatus[row._id] = row.count
    }
  }

  const totalsByDay = new Map(dayRows.map((row) => [row._id, row.total]))
  const salesPerDay = days.map((day) => ({ date: day, total: round2(totalsByDay.get(day) ?? 0) }))

  return { users, orders, activeAuctions, pendingProducers, byStatus, salesPerDay }
}

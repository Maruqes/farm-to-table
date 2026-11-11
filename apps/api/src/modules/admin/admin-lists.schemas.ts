import { z } from 'zod'
import { AUCTION_STATUSES } from '../auctions/auctions.model.js'
import { ORDER_STATUSES } from '../orders/orders.model.js'

const pageSchema = z.coerce
  .number({ error: 'Must be a number' })
  .int('Must be a whole number')
  .min(1, 'Must be at least 1')
  .max(10000, 'Too high')

export const adminUsersQuerySchema = z.object({
  q: z.string({ error: 'Must be text' }).trim().max(100, 'Too long').optional(),
  role: z.enum(['buyer', 'producer', 'admin'], { error: 'Unknown role' }).optional(),
  page: pageSchema.optional().default(1),
})

export const adminOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'Unknown status' }).optional(),
  page: pageSchema.optional().default(1),
})

export const adminAuctionsQuerySchema = z.object({
  status: z.enum(AUCTION_STATUSES, { error: 'Unknown status' }).optional(),
  page: pageSchema.optional().default(1),
})

export type AdminUsersQuery = z.output<typeof adminUsersQuerySchema>
export type AdminOrdersQuery = z.output<typeof adminOrdersQuerySchema>
export type AdminAuctionsQuery = z.output<typeof adminAuctionsQuerySchema>

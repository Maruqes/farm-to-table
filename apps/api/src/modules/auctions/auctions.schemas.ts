import { z } from 'zod'
import { PUBLIC_AUCTION_STATUSES } from './auctions.model.js'

// Public list (CT-03, CT-27). The producer manager list uses ?producer=me instead.
export const listAuctionsQuerySchema = z.object({
  status: z.enum(PUBLIC_AUCTION_STATUSES, { error: 'Unknown status' }),
  limit: z.coerce
    .number({ error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'Must be between 1 and 20')
    .max(20, 'Must be between 1 and 20')
    .optional(),
})

export type ListAuctionsQuery = z.output<typeof listAuctionsQuerySchema>

// The producer list is only reachable as ?producer=me; anything else is an invalid query.
export const producerAuctionsQuerySchema = z.object({
  producer: z.literal('me', { error: 'Must be me' }),
})

export const auctionIdParamsSchema = z.object({
  id: z.string({ error: 'Required' }).min(1, 'Required'),
})

// The producer, status, prices and bid count never come from the body: z.object strips them.
export const saveAuctionSchema = z.object({
  productId: z
    .string({ error: 'Required' })
    .trim()
    .regex(/^[0-9a-f]{24}$/i, 'Invalid product id'),
  quantity: z
    .number({ error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'Must be greater than 0')
    .max(1000000, 'Too high'),
  basePrice: z
    .number({ error: 'Must be a number' })
    .min(0.01, 'Must be at least 0.01')
    .max(1000000, 'Too high'),
  increment: z
    .number({ error: 'Must be a number' })
    .min(0.01, 'Must be at least 0.01')
    .max(1000000, 'Too high'),
  durationMinutes: z
    .number({ error: 'Must be a number' })
    .int('Must be a whole number')
    .min(5, 'Must be between 5 and 1440')
    .max(1440, 'Must be between 5 and 1440'),
  startsAt: z
    .string({ error: 'Required' })
    .trim()
    .min(1, 'Required')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
})

export type SaveAuctionInput = z.output<typeof saveAuctionSchema>

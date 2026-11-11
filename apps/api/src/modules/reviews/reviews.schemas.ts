import { z } from 'zod'

// Buyer, producer and products always come from the order, never from the body.
export const createReviewSchema = z.object({
  orderId: z.string({ error: 'Required' }).trim().min(1, 'Required'),
  rating: z
    .number({ error: 'Required' })
    .int('Must be a whole number')
    .min(1, 'Must be between 1 and 5')
    .max(5, 'Must be between 1 and 5'),
  text: z.string({ error: 'Must be text' }).trim().max(500, 'Too long').optional(),
})

export type CreateReviewInput = z.output<typeof createReviewSchema>

// The producer list is only reachable as ?producer=me; anything else is an invalid query.
export const producerReviewsQuerySchema = z.object({
  producer: z.literal('me', { error: 'Must be me' }),
})

export const reviewIdParamsSchema = z.object({
  id: z.string({ error: 'Required' }).min(1, 'Required'),
})

export const reportReviewSchema = z.object({
  reason: z.string({ error: 'Required' }).trim().min(1, 'Required').max(300, 'Too long'),
})

export type ReportReviewInput = z.output<typeof reportReviewSchema>

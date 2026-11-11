import { z } from 'zod'

// The queue is only reachable as ?reported=true; anything else is an invalid query.
export const adminReviewsQuerySchema = z.object({
  reported: z.literal('true', { error: 'Must be true' }),
})

export const adminReviewIdParamsSchema = z.object({
  id: z.string({ error: 'Required' }).min(1, 'Required'),
})

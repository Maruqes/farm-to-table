import { z } from 'zod'

export const listPendingProducersQuerySchema = z.object({
  status: z.literal('pending', { error: 'Unknown status' }).optional(),
})

export const adminProducerIdParamsSchema = z.object({
  id: z.string({ error: 'Required' }).min(1, 'Required'),
})

export const rejectProducerSchema = z.object({
  reason: z.string({ error: 'Must be text' }).trim().max(300, 'Too long').optional(),
})

export type RejectProducerInput = z.output<typeof rejectProducerSchema>

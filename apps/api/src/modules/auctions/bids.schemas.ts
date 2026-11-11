import { z } from 'zod'
import { round2 } from '../../lib/money.js'

export const MAX_BID = 1_000_000

// Extra keys (bidderId, name, leader...) never reach the service: z.object strips them.
export const placeBidSchema = z.object({
  amount: z
    .number({ error: 'Must be a number' })
    .refine(Number.isFinite, 'Must be a finite number')
    .positive('Must be greater than 0')
    .max(MAX_BID, 'Too high')
    .transform(round2)
    .refine((value) => value >= 0.01, 'Must be at least 0.01'),
})

export type PlaceBidInput = z.output<typeof placeBidSchema>

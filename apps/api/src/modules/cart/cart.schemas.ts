import { z } from 'zod'

export const saveCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string({ error: 'Required' }).min(1, 'Required'),
        quantity: z.number({ error: 'Must be a number' }).int('Must be a whole number').min(1, 'Minimum 1').max(1000, 'Maximum 1000'),
      }),
      { error: 'Required' },
    )
    .max(50, 'At most 50 lines')
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, 'Duplicate products'),
})

export type SaveCartInput = z.output<typeof saveCartSchema>

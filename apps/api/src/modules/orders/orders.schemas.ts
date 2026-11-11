import { z } from 'zod'

const addressSchema = z.object({
  line1: z.string({ error: 'Required' }).trim().min(1, 'Required').max(200, 'Too long'),
  city: z.string({ error: 'Required' }).trim().min(1, 'Required').max(100, 'Too long'),
  postalCode: z.string({ error: 'Required' }).trim().min(1, 'Required').max(20, 'Too long'),
})

// The request only chooses fulfilment and address; lines, prices and producers come from the server cart.
// A malformed address is ignored for pickup, as the contract says.
export const checkoutSchema = z
  .object({
    fulfilment: z.enum(['pickup', 'delivery'], { error: 'Must be pickup or delivery' }),
    address: z.unknown().optional(),
  })
  .transform((value, ctx) => {
    if (value.fulfilment === 'pickup') return { fulfilment: value.fulfilment, address: null }
    if (value.address === undefined || value.address === null) {
      for (const key of ['line1', 'city', 'postalCode'] as const) {
        ctx.addIssue({ code: 'custom', path: [key], message: 'Required' })
      }
      return z.NEVER
    }
    const parsed = addressSchema.safeParse(value.address)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: 'custom', path: [String(issue.path[0] ?? 'address')], message: issue.message })
      }
      return z.NEVER
    }
    return { fulfilment: value.fulfilment, address: parsed.data }
  })

export type CheckoutInput = z.output<typeof checkoutSchema>

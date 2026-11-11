import { z } from 'zod'

const emailField = z.string().trim().toLowerCase().email('Invalid email')

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  email: emailField,
  address: z.string().max(500, 'Address is too long'),
})

export const updateCardSchema = z.object({
  number: z.string().min(1, 'Card number is required'),
  holder: z.string().trim().min(1, 'Card holder is required'),
  expiry: z.string().min(1, 'Expiry is required'),
  simulateInvalid: z.boolean(),
})

export type UpdateProfileInput = z.output<typeof updateProfileSchema>
export type UpdateCardInput = z.output<typeof updateCardSchema>

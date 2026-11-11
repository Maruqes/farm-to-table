import { z } from 'zod'

const emailField = z.string().trim().toLowerCase().email('Invalid email')

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
    email: emailField,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    role: z.enum(['buyer', 'producer']),
    farmName: z.string().trim().min(1, 'Farm name is required').max(120, 'Farm name is too long').optional(),
    locality: z.string().trim().min(1, 'Locality is required').max(120, 'Locality is too long').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'producer') {
      if (data.farmName === undefined) {
        ctx.addIssue({ code: 'custom', path: ['farmName'], message: 'Farm name is required' })
      }
      if (data.locality === undefined) {
        ctx.addIssue({ code: 'custom', path: ['locality'], message: 'Locality is required' })
      }
    }
  })

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(72, 'Password must be at most 72 characters'),
})

export type RegisterInput = z.output<typeof registerSchema>
export type LoginInput = z.output<typeof loginSchema>

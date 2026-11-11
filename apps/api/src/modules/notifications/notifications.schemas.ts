import { z } from 'zod'

export const markReadSchema = z.strictObject({ read: z.literal(true, { error: 'Must be true' }) })

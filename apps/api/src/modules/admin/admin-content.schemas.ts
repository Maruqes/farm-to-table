import { z } from 'zod'

const contentType = z.enum(['product', 'producer'], { error: 'Unknown type' })

export const adminContentQuerySchema = z.object({
  type: contentType,
})

export const adminContentParamsSchema = z.object({
  type: contentType,
  id: z.string({ error: 'Required' }).min(1, 'Required'),
})

// Unknown keys are stripped by z.object; only `hidden` can change.
export const adminContentPatchSchema = z.object({
  hidden: z.boolean({ error: 'Must be true or false' }),
})

export type AdminContentPatchInput = z.output<typeof adminContentPatchSchema>

import { z } from 'zod'

export const listProducersQuerySchema = z.object({
  q: z.string().max(100, 'Too long').optional(),
  location: z.string().max(100, 'Too long').optional(),
})

const httpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export const saveProducerPageSchema = z
  .object({
    bio: z.string().trim().max(600, 'Bio is too long'),
    location: z.string().trim().min(1, 'Location is required'),
    lat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').nullable(),
    lng: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').nullable(),
    photoUrl: z.string().trim().refine((v) => v === '' || httpUrl(v), 'Must be an http(s) URL'),
  })
  .superRefine((v, ctx) => {
    if ((v.lat === null) !== (v.lng === null)) {
      ctx.addIssue({ code: 'custom', path: [v.lat === null ? 'lat' : 'lng'], message: 'lat and lng must be set together' })
    }
  })

export type ListProducersQuery = z.output<typeof listProducersQuerySchema>
export type SaveProducerPageInput = z.output<typeof saveProducerPageSchema>

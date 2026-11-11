import { z } from 'zod'
import { CATEGORIES, SEASONS } from './products.model.js'

export const listProductsQuerySchema = z.object({
  q: z.string().max(100, 'Too long').optional(),
  // `me` is reserved for BE-06 (own products).
  producer: z.string().max(100, 'Too long').refine((v) => v !== 'me', 'Not supported yet').optional(),
  category: z.enum(CATEGORIES, { error: 'Unknown category' }).optional(),
  location: z.string().max(100, 'Too long').optional(),
  season: z.enum(SEASONS, { error: 'Unknown season' }).optional(),
  organic: z.enum(['true', 'false'], { error: 'Must be true or false' }).optional(),
  sort: z.enum(['price-asc', 'price-desc', 'rating-desc'], { error: 'Unknown sort' }).optional(),
})

export type ListProductsQuery = z.output<typeof listProductsQuerySchema>

import { z } from 'zod'
import { CATEGORIES, SEASONS, UNITS } from './products.model.js'

export const listProductsQuerySchema = z.object({
  q: z.string().max(100, 'Too long').optional(),
  // `me` switches to the authenticated own-products list (guards run in the router).
  producer: z.string().max(100, 'Too long').optional(),
  category: z.enum(CATEGORIES, { error: 'Unknown category' }).optional(),
  location: z.string().max(100, 'Too long').optional(),
  season: z.enum(SEASONS, { error: 'Unknown season' }).optional(),
  organic: z.enum(['true', 'false'], { error: 'Must be true or false' }).optional(),
  sort: z.enum(['price-asc', 'price-desc', 'rating-desc'], { error: 'Unknown sort' }).optional(),
})

export type ListProductsQuery = z.output<typeof listProductsQuerySchema>

// Unknown keys (producer, hidden, averageRating, imageKey...) are stripped by z.object.
export const saveProductSchema = z.object({
  name: z.string({ error: 'Required' }).trim().min(2, 'Too short').max(80, 'Too long'),
  category: z.enum(CATEGORIES, { error: 'Unknown category' }),
  price: z.number({ error: 'Must be a number' }).gt(0, 'Must be greater than 0').max(100000, 'Too high'),
  unit: z.enum(UNITS, { error: 'Unknown unit' }),
  stock: z.number({ error: 'Must be a number' }).int('Must be an integer').min(0, 'Must be 0 or more').max(1000000, 'Too high'),
  season: z.enum(SEASONS, { error: 'Unknown season' }),
  organic: z.boolean({ error: 'Must be true or false' }),
})

export type SaveProductInput = z.output<typeof saveProductSchema>

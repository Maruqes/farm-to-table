import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { escapeRegex } from '../../lib/escape-regex.js'
import { env } from '../../config/env.js'
import { UserModel } from '../users/users.model.js'
import { ProductModel, type ProductDoc } from './products.model.js'
import type { ListProductsQuery } from './products.schemas.js'

const LIMIT = 200

type Producer = { _id: unknown, name: string, producer?: { location?: string } }
type Product = ProductDoc & { _id: unknown }

export const imageUrl = (key?: string) => (key ? { imageUrl: `${env.s3.endpoint}/${env.s3.bucket}/${key}` } : {})

// The one definition of "buyable": producer approved and visible, product not hidden; the list also needs stock.
export async function findBuyable(opts: { id?: string, q?: string, inStock?: boolean, producerFilter?: Record<string, unknown>, productFilter?: Record<string, unknown>, sort?: Record<string, 1 | -1> }) {
  const producers: Producer[] = await UserModel.find({
    role: 'producer',
    'producer.status': 'approved',
    'producer.hidden': { $ne: true },
    ...opts.producerFilter,
  }).select('name producer').lean()
  const byId = new Map(producers.map((p) => [String(p._id), p]))
  const filter: Record<string, unknown> = { ...opts.productFilter, producer: { $in: [...byId.keys()] }, hidden: { $ne: true } }
  if (opts.q) {
    const re = new RegExp(escapeRegex(opts.q), 'i')
    const named = producers.filter((p) => re.test(p.name)).map((p) => p._id)
    filter.$or = [{ name: re }, { ingredients: re }, { producer: { $in: named } }]
  }
  if (opts.id) filter._id = opts.id
  if (opts.inStock) filter.stock = { $gt: 0 }
  const products: Product[] = await ProductModel.find(filter).sort(opts.sort ?? { name: 1 }).limit(LIMIT).lean()
  return products.map((p) => ({ p, producer: byId.get(String(p.producer))! }))
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  'price-asc': { price: 1, name: 1 },
  'price-desc': { price: -1, name: 1 },
  'rating-desc': { averageRating: -1, name: 1 },
}

export async function listProducts(query: ListProductsQuery) {
  if (query.producer && !mongoose.isValidObjectId(query.producer)) return []
  const producerFilter: Record<string, unknown> = {}
  if (query.producer) producerFilter._id = query.producer
  if (query.location) producerFilter['producer.location'] = { $regex: escapeRegex(query.location), $options: 'i' }
  const productFilter: Record<string, unknown> = {}
  if (query.category) productFilter.category = query.category
  if (query.season) productFilter.season = query.season
  if (query.organic) productFilter.organic = query.organic === 'true'
  const rows = await findBuyable({ q: query.q, inStock: true, producerFilter, productFilter, sort: SORTS[query.sort ?? ''] })
  return rows.map(({ p, producer }) => ({
      id: String(p._id),
      name: p.name,
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      category: p.category,
      ...imageUrl(p.imageKey),
      producer: { id: String(producer._id), name: producer.name, location: producer.producer?.location ?? '' },
      averageRating: p.averageRating,
    }))
}

export async function getProduct(id: string) {
  const [row] = mongoose.isValidObjectId(id) ? await findBuyable({ id }) : []
  if (!row) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  const { p, producer } = row
  return {
    id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    stock: p.stock,
    category: p.category,
    ...imageUrl(p.imageKey),
    producer: { id: String(producer._id), name: producer.name, location: producer.producer?.location ?? '' },
    averageRating: p.averageRating,
    description: p.description,
    reviews: [],
  }
}

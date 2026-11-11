import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { escapeRegex } from '../../lib/escape-regex.js'
import { round2 } from '../../lib/money.js'
import { publicProducerName } from '../../lib/producer-name.js'
import { ProductModel, type ProductDoc } from '../products/products.model.js'
import { imageUrl } from '../products/products.service.js'
import { UserModel, type UserDoc } from '../users/users.model.js'
import type { ListProducersQuery, SaveProducerPageInput } from './producers.schemas.js'

const PUBLIC_FILTER = { role: 'producer', 'producer.status': 'approved', 'producer.hidden': { $ne: true } }

type ProducerUser = { _id: unknown } & Pick<UserDoc, 'name' | 'producer'>

export interface CatalogStats {
  products: unknown[]
  productCount: number
}

export async function getProducerCatalogStats(producerIds: string[]): Promise<Map<string, CatalogStats>> {
  const docs: (ProductDoc & { _id: unknown })[] = await ProductModel.find({ producer: { $in: producerIds }, hidden: { $ne: true } }).sort({ name: 1 }).lean()
  return new Map(producerIds.map((id) => {
    const mine = docs.filter((p) => String(p.producer) === id)
    return [id, {
      products: mine.map((p) => ({
        id: String(p._id), name: p.name, price: p.price, unit: p.unit, stock: p.stock, category: p.category,
        ...imageUrl(p), averageRating: p.averageRating,
      })),
      productCount: mine.length,
    }]
  }))
}

function coords(p: UserDoc['producer']): { lat?: number, lng?: number } {
  return typeof p?.lat === 'number' && typeof p?.lng === 'number' ? { lat: p.lat, lng: p.lng } : {}
}

export async function listProducers(query: ListProducersQuery) {
  const filter: Record<string, unknown> = { ...PUBLIC_FILTER }
  if (query.q) filter['producer.farmName'] = { $regex: escapeRegex(query.q), $options: 'i' }
  if (query.location) filter['producer.location'] = { $regex: `^${escapeRegex(query.location)}$`, $options: 'i' }
  const docs: ProducerUser[] = await UserModel.find(filter).select('name producer').sort({ 'producer.farmName': 1 }).lean()
  const stats = await getProducerCatalogStats(docs.map((d) => String(d._id)))
  return docs.map((d) => {
    const s = stats.get(String(d._id))!
    return {
      id: String(d._id),
      name: publicProducerName(d),
      location: d.producer?.location ?? '',
      averageRating: round2(d.producer?.averageRating ?? 0),
      productCount: s.productCount,
    }
  })
}

export async function getPublicProducer(id: string) {
  const doc: ProducerUser | null = mongoose.isValidObjectId(id)
    ? await UserModel.findOne({ ...PUBLIC_FILTER, _id: id } as Record<string, unknown>).select('name producer').lean()
    : null
  if (!doc) throw new ApiError(404, 'PRODUCER_NOT_FOUND', 'Producer not found')
  const s = (await getProducerCatalogStats([id])).get(id)!
  return {
    id,
    name: publicProducerName(doc),
    bio: doc.producer?.bio ?? '',
    location: doc.producer?.location ?? '',
    ...coords(doc.producer),
    averageRating: round2(doc.producer?.averageRating ?? 0),
    products: s.products,
  }
}

function toPage(doc: ProducerUser) {
  const p = doc.producer
  return {
    id: String(doc._id),
    name: publicProducerName(doc),
    bio: p?.bio ?? '',
    location: p?.location ?? '',
    ...coords(p),
    ...(p?.photoUrl ? { photoUrl: p.photoUrl } : {}),
  }
}

export async function getMyPage(userId: string) {
  const doc: ProducerUser | null = await UserModel.findById(userId).select('name producer').lean()
  if (!doc) throw new ApiError(404, 'NOT_FOUND', 'User not found')
  return toPage(doc)
}

export async function updateMyPage(userId: string, input: SaveProducerPageInput) {
  const $set: Record<string, unknown> = { 'producer.bio': input.bio, 'producer.location': input.location, 'producer.photoUrl': input.photoUrl }
  const update: Record<string, unknown> = { $set }
  if (input.lat === null || input.lng === null) update.$unset = { 'producer.lat': 1, 'producer.lng': 1 }
  else Object.assign($set, { 'producer.lat': input.lat, 'producer.lng': input.lng })
  const doc: ProducerUser | null = await UserModel.findByIdAndUpdate(userId, update, { returnDocument: 'after' }).select('name producer').lean()
  if (!doc) throw new ApiError(404, 'NOT_FOUND', 'User not found')
  return toPage(doc)
}

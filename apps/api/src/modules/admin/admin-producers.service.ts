import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { notify } from '../notifications/notifications.service.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'

export interface PendingProducerDto {
  id: string
  name: string
  email: string
  location?: string
  bio?: string
  categories: string[]
  appliedAt: string
  status: 'pending'
}

type PendingDoc = {
  _id: unknown
  name: string
  email: string
  producer?: { farmName?: string, location?: string, bio?: string }
}

export async function listPendingProducers(): Promise<PendingProducerDto[]> {
  const docs: PendingDoc[] = await UserModel.find({ role: 'producer', 'producer.status': 'pending' })
    .select('name email producer')
    .sort({ _id: -1 })
    .lean()
  return Promise.all(docs.map(async (d) => {
    const id = String(d._id)
    const categories: string[] = await ProductModel.distinct('category', { producer: id })
    const dto: PendingProducerDto = {
      id,
      name: d.producer?.farmName ?? d.name,
      email: d.email,
      categories: [...categories].sort(),
      appliedAt: new mongoose.Types.ObjectId(id).getTimestamp().toISOString(),
      status: 'pending',
    }
    if (d.producer?.location) dto.location = d.producer.location
    if (d.producer?.bio) dto.bio = d.producer.bio
    return dto
  }))
}

async function decideProducer(id: string, update: Record<string, unknown>): Promise<string> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'PRODUCER_NOT_FOUND', 'Producer not found')
  const doc = await UserModel.findOneAndUpdate(
    { _id: id, role: 'producer', 'producer.status': 'pending' },
    update,
  ).select('_id')
  if (!doc) throw new ApiError(404, 'PRODUCER_NOT_FOUND', 'Producer not found')
  return String(doc._id)
}

export async function approveProducer(id: string): Promise<void> {
  const producerId = await decideProducer(id, { $set: { 'producer.status': 'approved' } })
  await notify(producerId, 'producer-approved', 'Your producer application was approved. You can now add products.')
}

export async function rejectProducer(id: string, reason?: string): Promise<void> {
  const clean = reason ?? ''
  const producerId = await decideProducer(id, { $set: { 'producer.status': 'rejected', 'producer.rejectReason': clean } })
  await notify(
    producerId,
    'producer-rejected',
    clean ? `Your producer application was rejected: ${clean}` : 'Your producer application was rejected.',
  )
}

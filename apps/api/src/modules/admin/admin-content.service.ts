import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { notify } from '../notifications/notifications.service.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'

export interface AdminContentItemDto {
  id: string
  name: string
  hidden: boolean
}

export async function listAdminContent(type: 'product' | 'producer'): Promise<AdminContentItemDto[]> {
  if (type === 'product') {
    const docs = await ProductModel.find({}).select('name hidden').sort({ name: 1 }).lean()
    return docs.map((d) => ({ id: String(d._id), name: d.name, hidden: d.hidden ?? false }))
  }
  const docs = await UserModel.find({ role: 'producer' }).select('name producer').sort({ name: 1 }).lean()
  return docs.map((d) => ({
    id: String(d._id),
    name: d.producer?.farmName ?? d.name,
    hidden: d.producer?.hidden ?? false,
  }))
}

export async function setContentHidden(
  type: 'product' | 'producer',
  id: string,
  hidden: boolean,
): Promise<AdminContentItemDto> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'CONTENT_NOT_FOUND', 'Content not found')
  if (type === 'product') {
    const before = await ProductModel.findById(id).select('name hidden producer').lean()
    if (!before) throw new ApiError(404, 'CONTENT_NOT_FOUND', 'Content not found')
    if ((before.hidden ?? false) === hidden) {
      return { id, name: before.name, hidden: before.hidden ?? false }
    }
    await ProductModel.updateOne({ _id: id }, { $set: { hidden } })
    if (hidden) {
      await notify(
        String(before.producer),
        'product-hidden',
        `Your product "${before.name}" was hidden by an administrator.`,
      )
    }
    return { id, name: before.name, hidden }
  }
  const before = await UserModel.findOne({ _id: id, role: 'producer' }).select('name producer').lean()
  if (!before) throw new ApiError(404, 'CONTENT_NOT_FOUND', 'Content not found')
  if ((before.producer?.hidden ?? false) === hidden) {
    return { id, name: before.producer?.farmName ?? before.name, hidden: before.producer?.hidden ?? false }
  }
  await UserModel.updateOne({ _id: id }, { $set: { 'producer.hidden': hidden } })
  if (hidden) {
    await notify(id, 'product-hidden', 'Your producer page was hidden by an administrator.')
  }
  return { id, name: before.producer?.farmName ?? before.name, hidden }
}

import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import { ApiError } from '../../lib/api-error.js'
import { deleteObject, getObject, putObject } from '../../lib/storage.js'
import { ProductModel } from './products.model.js'
import { imageUrl } from './products.service.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('image')

export function receiveImage(req: Request, res: Response, next: NextFunction): void {
  upload(req, res, (err?: unknown) => {
    if (err) {
      const big = (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
      return next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid upload', { image: big ? 'Image must be 5 MB or smaller' : 'Invalid image upload' }))
    }
    if (!req.file) return next(new ApiError(400, 'VALIDATION_ERROR', 'Image is required', { image: 'Image is required' }))
    next()
  })
}

// Type comes from the file's magic bytes, never from the client's MIME type or name.
function sniff(b: Buffer): { ext: string, type: string } | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' }
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return { ext: 'png', type: 'image/png' }
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return { ext: 'webp', type: 'image/webp' }
  return null
}

export async function uploadImageController(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  const doc = mongoose.isValidObjectId(id) ? await ProductModel.findById(id).select('producer imageKey').lean() : null
  if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Product not found')
  if (String(doc.producer) !== req.user!.sub) throw new ApiError(403, 'FORBIDDEN', 'Not your product')
  const buf = req.file!.buffer
  const kind = sniff(buf)
  if (!kind) throw new ApiError(400, 'VALIDATION_ERROR', 'Unsupported image', { image: 'Image must be JPEG, PNG or WebP' })
  const key = `products/${id}/${randomUUID()}.${kind.ext}`
  await putObject(key, buf, kind.type)
  const updated = await ProductModel.findByIdAndUpdate(id, { imageKey: key }, { new: true }).lean()
  if (doc.imageKey) await deleteObject(doc.imageKey).catch(() => {})
  res.json(imageUrl(updated!))
}

export async function getImageController(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  const doc = mongoose.isValidObjectId(id) ? await ProductModel.findById(id).select('imageKey').lean() : null
  const obj = doc?.imageKey ? await getObject(doc.imageKey) : null
  if (!obj) throw new ApiError(404, 'NOT_FOUND', 'Image not found')
  res.set({ 'Content-Type': obj.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' }).send(obj.body)
}

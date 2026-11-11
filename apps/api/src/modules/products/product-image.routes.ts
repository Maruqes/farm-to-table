import type { Router } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { getImageController, receiveImage, uploadImageController } from './product-image.controller.js'

export function mountProductImageRoutes(r: Router): void {
  r.get('/:id/image', getImageController)
  r.post('/:id/image', requireAuth, requireRole('producer'), requireApprovedProducer, receiveImage, uploadImageController)
}

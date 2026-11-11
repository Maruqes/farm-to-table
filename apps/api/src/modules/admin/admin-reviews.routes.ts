import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import {
  hideAdminReviewController,
  keepAdminReviewController,
  listAdminReviewsController,
} from './admin-reviews.controller.js'
import { adminReviewIdParamsSchema, adminReviewsQuerySchema } from './admin-reviews.schemas.js'

export const adminReviewsRouter = Router()

adminReviewsRouter.get('/', validate({ query: adminReviewsQuerySchema }), listAdminReviewsController)
adminReviewsRouter.post(
  '/:id/keep',
  validate({ params: adminReviewIdParamsSchema }),
  keepAdminReviewController,
)
adminReviewsRouter.post(
  '/:id/hide',
  validate({ params: adminReviewIdParamsSchema }),
  hideAdminReviewController,
)

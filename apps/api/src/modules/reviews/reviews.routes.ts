import { Router } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createReviewController, listProducerReviewsController, reportReviewController } from './reviews.controller.js'
import { createReviewSchema, producerReviewsQuerySchema, reportReviewSchema, reviewIdParamsSchema } from './reviews.schemas.js'

export const reviewsRouter = Router()

const buyer = [requireAuth, requireRole('buyer')]
const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

reviewsRouter.post('/', ...buyer, validate({ body: createReviewSchema }), createReviewController)
reviewsRouter.get('/', ...approvedProducer, validate({ query: producerReviewsQuerySchema }), listProducerReviewsController)
reviewsRouter.post(
  '/:id/report',
  ...approvedProducer,
  validate({ params: reviewIdParamsSchema, body: reportReviewSchema }),
  reportReviewController,
)

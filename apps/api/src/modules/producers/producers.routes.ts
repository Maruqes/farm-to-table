import { Router } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  getMyPageController,
  getMyStatsController,
  getProducerController,
  listProducersController,
  updateMyPageController,
} from './producers.controller.js'
import { listProducersQuerySchema, saveProducerPageSchema } from './producers.schemas.js'

export const producersRouter = Router()

const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

producersRouter.get('/', validate({ query: listProducersQuerySchema }), listProducersController)
// /me must be registered before /:id.
producersRouter.get('/me', ...approvedProducer, getMyPageController)
producersRouter.get('/me/stats', ...approvedProducer, getMyStatsController)
producersRouter.put('/me', ...approvedProducer, validate({ body: saveProducerPageSchema }), updateMyPageController)
producersRouter.get('/:id', getProducerController)

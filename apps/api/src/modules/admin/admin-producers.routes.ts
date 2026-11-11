import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import {
  approveProducerController,
  listPendingProducersController,
  rejectProducerController,
} from './admin-producers.controller.js'
import {
  adminProducerIdParamsSchema,
  listPendingProducersQuerySchema,
  rejectProducerSchema,
} from './admin-producers.schemas.js'

export const adminProducersRouter = Router()

adminProducersRouter.get('/', validate({ query: listPendingProducersQuerySchema }), listPendingProducersController)
adminProducersRouter.post(
  '/:id/approve',
  validate({ params: adminProducerIdParamsSchema }),
  approveProducerController,
)
adminProducersRouter.post(
  '/:id/reject',
  validate({ params: adminProducerIdParamsSchema, body: rejectProducerSchema }),
  rejectProducerController,
)

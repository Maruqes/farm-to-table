import { Router } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  changeOrderStatusController,
  createOrdersController,
  listMyOrdersController,
  listProducerOrdersController,
} from './orders.controller.js'
import { checkoutSchema, orderIdParamsSchema, producerOrdersQuerySchema, updateOrderStatusSchema } from './orders.schemas.js'

export const ordersRouter = Router()

const buyer = [requireAuth, requireRole('buyer')]
const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

ordersRouter.post('/', ...buyer, validate({ body: checkoutSchema }), createOrdersController)
ordersRouter.get('/mine', ...buyer, listMyOrdersController)
ordersRouter.get('/', ...approvedProducer, validate({ query: producerOrdersQuerySchema }), listProducerOrdersController)
ordersRouter.patch(
  '/:id/status',
  ...approvedProducer,
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  changeOrderStatusController,
)

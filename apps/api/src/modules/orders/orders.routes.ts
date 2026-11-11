import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createOrdersController, listMyOrdersController } from './orders.controller.js'
import { checkoutSchema } from './orders.schemas.js'

export const ordersRouter = Router()

ordersRouter.use(requireAuth, requireRole('buyer'))
ordersRouter.post('/', validate({ body: checkoutSchema }), createOrdersController)
ordersRouter.get('/mine', listMyOrdersController)

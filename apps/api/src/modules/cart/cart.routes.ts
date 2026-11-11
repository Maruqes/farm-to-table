import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { getCartController, saveCartController } from './cart.controller.js'
import { saveCartSchema } from './cart.schemas.js'

export const cartRouter = Router()

cartRouter.use(requireAuth, requireRole('buyer'))
cartRouter.get('/', getCartController)
cartRouter.put('/', validate({ body: saveCartSchema }), saveCartController)

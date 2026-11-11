import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { getProductController, listProductsController } from './products.controller.js'
import { listProductsQuerySchema } from './products.schemas.js'

export const productsRouter = Router()

productsRouter.get('/', validate({ query: listProductsQuerySchema }), listProductsController)
productsRouter.get('/:id', getProductController)

import { Router, type NextFunction, type Request, type Response } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  createProductController,
  deleteProductController,
  getProductController,
  listOwnProductsController,
  listProductsController,
  updateProductController,
} from './products.controller.js'
import { listProductsQuerySchema, saveProductSchema } from './products.schemas.js'

export const productsRouter = Router()

const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

// Same path is public unless `?producer=me`: only then are the guards applied, otherwise fall through.
productsRouter.get(
  '/',
  (req: Request, _res: Response, next: NextFunction) => next(req.query.producer === 'me' ? undefined : 'route'),
  ...approvedProducer,
  listOwnProductsController,
)
productsRouter.get('/', validate({ query: listProductsQuerySchema }), listProductsController)
productsRouter.post('/', ...approvedProducer, validate({ body: saveProductSchema }), createProductController)
productsRouter.get('/:id', getProductController)
productsRouter.put('/:id', ...approvedProducer, validate({ body: saveProductSchema }), updateProductController)
productsRouter.delete('/:id', ...approvedProducer, deleteProductController)

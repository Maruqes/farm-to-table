import { Router, type NextFunction, type Request, type Response } from 'express'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  cancelAuctionController,
  createAuctionController,
  getPublicAuctionController,
  listProducerAuctionsController,
  listPublicAuctionsController,
  publishAuctionController,
  updateAuctionController,
} from './auctions.controller.js'
import {
  auctionIdParamsSchema,
  listAuctionsQuerySchema,
  producerAuctionsQuerySchema,
  saveAuctionSchema,
} from './auctions.schemas.js'

export const auctionsRouter = Router()

const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

// Same path is public unless `?producer=me`: only then are the guards applied, otherwise fall through.
auctionsRouter.get(
  '/',
  (req: Request, _res: Response, next: NextFunction) => next(req.query.producer === 'me' ? undefined : 'route'),
  ...approvedProducer,
  validate({ query: producerAuctionsQuerySchema }),
  listProducerAuctionsController,
)
auctionsRouter.get('/', validate({ query: listAuctionsQuerySchema }), listPublicAuctionsController)
auctionsRouter.post('/', ...approvedProducer, validate({ body: saveAuctionSchema }), createAuctionController)
auctionsRouter.put(
  '/:id',
  ...approvedProducer,
  validate({ params: auctionIdParamsSchema, body: saveAuctionSchema }),
  updateAuctionController,
)
auctionsRouter.post(
  '/:id/publish',
  ...approvedProducer,
  validate({ params: auctionIdParamsSchema }),
  publishAuctionController,
)
auctionsRouter.post(
  '/:id/cancel',
  ...approvedProducer,
  validate({ params: auctionIdParamsSchema }),
  cancelAuctionController,
)
auctionsRouter.get('/:id', validate({ params: auctionIdParamsSchema }), getPublicAuctionController)

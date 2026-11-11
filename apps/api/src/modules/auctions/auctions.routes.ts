import { Router, type NextFunction, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
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
import { placeBidController } from './bids.controller.js'
import { placeBidSchema } from './bids.schemas.js'

export const auctionsRouter = Router()

const approvedProducer = [requireAuth, requireRole('producer'), requireApprovedProducer]

// Bids are limited per authenticated user, so the limiter runs after requireAuth.
const bidLimiter = rateLimit({
  windowMs: 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub ?? 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many bids, slow down' } })
  },
})

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
auctionsRouter.post(
  '/:id/bids',
  requireAuth,
  requireRole('buyer', 'producer'),
  bidLimiter,
  validate({ params: auctionIdParamsSchema, body: placeBidSchema }),
  placeBidController,
)
auctionsRouter.get('/:id', validate({ params: auctionIdParamsSchema }), getPublicAuctionController)

import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { openapi } from './docs/openapi.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { producersRouter } from './modules/producers/producers.routes.js'
import { productsRouter } from './modules/products/products.routes.js'
import { cartRouter } from './modules/cart/cart.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { ordersRouter } from './modules/orders/orders.routes.js'
import { reviewsRouter } from './modules/reviews/reviews.routes.js'
import { auctionsRouter } from './modules/auctions/auctions.routes.js'

// Express app only (no listen) so tests can import it. Routers are mounted from src/modules/*.
export const app = express()
// Rate limiters key on req.ip; behind the compose nginx this makes them per-user.
app.set('trust proxy', env.trustProxy)
app.use(helmet())
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Swagger UI + raw document. The global helmet() above blocks Swagger's inline
// scripts/styles, so /api-docs gets its own relaxed CSP that overwrites the
// global header on this path only; the rest of the app keeps the strict one.
app.use(
  '/api-docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
  }),
)
app.get('/api-docs/openapi.json', (_req, res) => {
  res.json(openapi)
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Farm to Table API' }))

// Module routers are mounted here (each later ticket adds one app.use line).
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/producers', producersRouter)
app.use('/api/products', productsRouter)
app.use('/api/cart', cartRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/auctions', auctionsRouter)
app.use('/api/admin', adminRouter)

app.use(notFound)
app.use(errorHandler)

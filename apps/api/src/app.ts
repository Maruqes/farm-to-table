import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errors.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { producersRouter } from './modules/producers/producers.routes.js'
import { productsRouter } from './modules/products/products.routes.js'

// Express app only (no listen) so tests can import it. Routers are mounted from src/modules/*.
export const app = express()
app.use(helmet())
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Module routers are mounted here (each later ticket adds one app.use line).
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/producers', producersRouter)
app.use('/api/products', productsRouter)

app.use(notFound)
app.use(errorHandler)

import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errors.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/users.routes.js'

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

app.use(notFound)
app.use(errorHandler)

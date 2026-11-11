import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { validate } from '../../middleware/validate.js'
import { loginController, registerController } from './auth.controller.js'
import { loginSchema, registerSchema } from './auth.schemas.js'

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, slow down' } })
  },
})

export const authRouter = Router()

authRouter.use(authLimiter)
authRouter.post('/register', validate({ body: registerSchema }), registerController)
authRouter.post('/login', validate({ body: loginSchema }), loginController)

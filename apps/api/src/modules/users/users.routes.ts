import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { getMeController, updateCardController, updateMeController } from './users.controller.js'
import { updateCardSchema, updateProfileSchema } from './users.schemas.js'

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, requireRole('buyer', 'producer'), getMeController)
usersRouter.put('/me', requireAuth, requireRole('buyer', 'producer'), validate({ body: updateProfileSchema }), updateMeController)
usersRouter.put(
  '/me/card',
  requireAuth,
  requireRole('buyer'),
  validate({ body: updateCardSchema }),
  updateCardController,
)

import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { listNotificationsController, markReadController } from './notifications.controller.js'
import { markReadSchema } from './notifications.schemas.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth, requireRole('buyer', 'producer'))
notificationsRouter.get('/', listNotificationsController)
notificationsRouter.patch('/:id', validate({ body: markReadSchema }), markReadController)

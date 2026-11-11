import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { getAdminStatusController } from './admin-status.controller.js'
import { adminStatusQuerySchema } from './admin-status.schemas.js'

export const adminStatusRouter = Router()

adminStatusRouter.get('/', validate({ query: adminStatusQuerySchema }), getAdminStatusController)

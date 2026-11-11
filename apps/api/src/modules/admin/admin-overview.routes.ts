import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { getAdminSummaryController } from './admin-overview.controller.js'
import { adminOverviewQuerySchema } from './admin-overview.schemas.js'

export const adminOverviewRouter = Router()

adminOverviewRouter.get('/', validate({ query: adminOverviewQuerySchema }), getAdminSummaryController)

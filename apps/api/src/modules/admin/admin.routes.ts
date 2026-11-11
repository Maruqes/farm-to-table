import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { adminContentRouter } from './admin-content.routes.js'
import { adminListsRouter } from './admin-lists.routes.js'
import { adminOverviewRouter } from './admin-overview.routes.js'
import { adminProducersRouter } from './admin-producers.routes.js'
import { adminReviewsRouter } from './admin-reviews.routes.js'
import { adminStatusRouter } from './admin-status.routes.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.use('/status', adminStatusRouter)
adminRouter.use('/summary', adminOverviewRouter)
adminRouter.use('/', adminListsRouter)
adminRouter.use('/producers', adminProducersRouter)
adminRouter.use('/content', adminContentRouter)
adminRouter.use('/reviews', adminReviewsRouter)

import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import {
  listAdminAuctionsController,
  listAdminOrdersController,
  listAdminUsersController,
} from './admin-lists.controller.js'
import { adminAuctionsQuerySchema, adminOrdersQuerySchema, adminUsersQuerySchema } from './admin-lists.schemas.js'

export const adminListsRouter = Router()

adminListsRouter.get('/users', validate({ query: adminUsersQuerySchema }), listAdminUsersController)
adminListsRouter.get('/orders', validate({ query: adminOrdersQuerySchema }), listAdminOrdersController)
adminListsRouter.get('/auctions', validate({ query: adminAuctionsQuerySchema }), listAdminAuctionsController)

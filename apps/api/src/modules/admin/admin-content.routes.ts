import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { listAdminContentController, patchAdminContentController } from './admin-content.controller.js'
import { adminContentParamsSchema, adminContentPatchSchema, adminContentQuerySchema } from './admin-content.schemas.js'

export const adminContentRouter = Router()

adminContentRouter.get('/', validate({ query: adminContentQuerySchema }), listAdminContentController)
adminContentRouter.patch(
  '/:type/:id',
  validate({ params: adminContentParamsSchema, body: adminContentPatchSchema }),
  patchAdminContentController,
)

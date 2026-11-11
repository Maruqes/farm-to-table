import { z } from 'zod'

// GET /api/admin/summary takes no query: any key is stripped by validate.
export const adminOverviewQuerySchema = z.object({})

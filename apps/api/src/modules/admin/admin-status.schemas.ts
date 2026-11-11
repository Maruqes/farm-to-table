import { z } from 'zod'

// GET /api/admin/status takes no query: any key is stripped by validate.
export const adminStatusQuerySchema = z.object({})

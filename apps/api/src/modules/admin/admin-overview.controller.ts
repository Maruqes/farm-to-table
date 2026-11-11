import type { Request, Response } from 'express'
import { getAdminSummary } from './admin-overview.service.js'

export async function getAdminSummaryController(_req: Request, res: Response): Promise<void> {
  res.json(await getAdminSummary())
}

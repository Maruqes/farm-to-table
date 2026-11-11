import type { Request, Response } from 'express'
import { getAdminStatus } from './admin-status.service.js'

export async function getAdminStatusController(_req: Request, res: Response): Promise<void> {
  res.json(await getAdminStatus())
}

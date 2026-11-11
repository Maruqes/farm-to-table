import type { Request, Response } from 'express'
import { listNotifications, markRead } from './notifications.service.js'

export async function listNotificationsController(req: Request, res: Response): Promise<void> {
  res.json(await listNotifications(req.user!.sub))
}

export async function markReadController(req: Request, res: Response): Promise<void> {
  await markRead(req.user!.sub, String(req.params.id))
  res.json({})
}

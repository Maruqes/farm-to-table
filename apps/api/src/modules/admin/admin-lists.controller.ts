import type { Request, Response } from 'express'
import type { AdminAuctionsQuery, AdminOrdersQuery, AdminUsersQuery } from './admin-lists.schemas.js'
import { listAdminAuctions, listAdminOrders, listAdminUsers } from './admin-lists.service.js'

export async function listAdminUsersController(req: Request, res: Response): Promise<void> {
  res.json(await listAdminUsers(req.query as unknown as AdminUsersQuery))
}

export async function listAdminOrdersController(req: Request, res: Response): Promise<void> {
  res.json(await listAdminOrders(req.query as unknown as AdminOrdersQuery))
}

export async function listAdminAuctionsController(req: Request, res: Response): Promise<void> {
  res.json(await listAdminAuctions(req.query as unknown as AdminAuctionsQuery))
}

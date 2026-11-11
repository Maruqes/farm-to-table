import type { Request, Response } from 'express'
import type { CheckoutInput } from './orders.schemas.js'
import { checkout, listMyOrders } from './orders.service.js'

export async function createOrdersController(req: Request, res: Response): Promise<void> {
  res.status(201).json(await checkout(req.user!.sub, req.body as CheckoutInput))
}

export async function listMyOrdersController(req: Request, res: Response): Promise<void> {
  res.json(await listMyOrders(req.user!.sub))
}

import type { Request, Response } from 'express'
import type { CheckoutInput, UpdateOrderStatusInput } from './orders.schemas.js'
import { changeOrderStatus, checkout, listMyOrders, listProducerOrders } from './orders.service.js'

export async function createOrdersController(req: Request, res: Response): Promise<void> {
  res.status(201).json(await checkout(req.user!.sub, req.body as CheckoutInput))
}

export async function listMyOrdersController(req: Request, res: Response): Promise<void> {
  res.json(await listMyOrders(req.user!.sub))
}

export async function listProducerOrdersController(req: Request, res: Response): Promise<void> {
  res.json(await listProducerOrders(req.user!.sub))
}

export async function changeOrderStatusController(req: Request, res: Response): Promise<void> {
  const { status } = req.body as UpdateOrderStatusInput
  res.json(await changeOrderStatus(req.user!.sub, String(req.params.id), status))
}

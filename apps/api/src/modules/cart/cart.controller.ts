import type { Request, Response } from 'express'
import type { SaveCartInput } from './cart.schemas.js'
import { getCart, saveCart } from './cart.service.js'

export async function getCartController(req: Request, res: Response): Promise<void> {
  res.json(await getCart(req.user!.sub))
}

export async function saveCartController(req: Request, res: Response): Promise<void> {
  res.json(await saveCart(req.user!.sub, req.body as SaveCartInput))
}

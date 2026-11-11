import type { Request, Response } from 'express'
import type { PlaceBidInput } from './bids.schemas.js'
import { placeBid } from './bids.service.js'

export async function placeBidController(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  const bid = await placeBid({ id: req.user!.sub, role: req.user!.role }, id, req.body as PlaceBidInput)
  res.status(201).location(`/api/auctions/${id}/bids/${bid.id}`).json(bid)
}

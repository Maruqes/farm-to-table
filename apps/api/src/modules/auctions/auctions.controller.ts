import type { Request, Response } from 'express'
import type { ListAuctionsQuery, SaveAuctionInput } from './auctions.schemas.js'
import {
  cancelAuction,
  createAuction,
  getPublicAuction,
  listProducerAuctions,
  listPublicAuctions,
  publishAuction,
  updateAuction,
} from './auctions.service.js'

export async function listPublicAuctionsController(req: Request, res: Response): Promise<void> {
  res.json(await listPublicAuctions(req.query as unknown as ListAuctionsQuery))
}

export async function getPublicAuctionController(req: Request, res: Response): Promise<void> {
  res.json(await getPublicAuction(String(req.params.id)))
}

export async function listProducerAuctionsController(req: Request, res: Response): Promise<void> {
  res.json(await listProducerAuctions(req.user!.sub))
}

export async function createAuctionController(req: Request, res: Response): Promise<void> {
  const auction = await createAuction(req.user!.sub, req.body as SaveAuctionInput)
  res.status(201).location(`/api/auctions/${auction.id}`).json(auction)
}

export async function updateAuctionController(req: Request, res: Response): Promise<void> {
  res.json(await updateAuction(req.user!.sub, String(req.params.id), req.body as SaveAuctionInput))
}

export async function publishAuctionController(req: Request, res: Response): Promise<void> {
  res.json(await publishAuction(req.user!.sub, String(req.params.id)))
}

export async function cancelAuctionController(req: Request, res: Response): Promise<void> {
  res.json(await cancelAuction(req.user!.sub, String(req.params.id)))
}

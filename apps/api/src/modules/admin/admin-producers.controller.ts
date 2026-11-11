import type { Request, Response } from 'express'
import type { RejectProducerInput } from './admin-producers.schemas.js'
import { approveProducer, listPendingProducers, rejectProducer } from './admin-producers.service.js'

export async function listPendingProducersController(_req: Request, res: Response): Promise<void> {
  res.json(await listPendingProducers())
}

export async function approveProducerController(req: Request, res: Response): Promise<void> {
  await approveProducer(String(req.params.id))
  res.json({})
}

export async function rejectProducerController(req: Request, res: Response): Promise<void> {
  await rejectProducer(String(req.params.id), (req.body as RejectProducerInput).reason)
  res.json({})
}

import type { Request, Response } from 'express'
import type { ListProducersQuery } from './producers.schemas.js'
import { getMyPage, getPublicProducer, listProducers, updateMyPage } from './producers.service.js'

export async function listProducersController(req: Request, res: Response): Promise<void> {
  res.json(await listProducers(req.query as ListProducersQuery))
}

export async function getProducerController(req: Request, res: Response): Promise<void> {
  res.json(await getPublicProducer(String(req.params.id)))
}

export async function getMyPageController(req: Request, res: Response): Promise<void> {
  res.json(await getMyPage(req.user!.sub))
}

export async function updateMyPageController(req: Request, res: Response): Promise<void> {
  res.json(await updateMyPage(req.user!.sub, req.body))
}

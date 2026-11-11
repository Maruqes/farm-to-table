import type { Request, Response } from 'express'
import { getProfile, updateCard, updateProfile } from './users.service.js'

export async function getMeController(req: Request, res: Response): Promise<void> {
  const result = await getProfile(req.user!.sub)
  res.status(200).json(result)
}

export async function updateMeController(req: Request, res: Response): Promise<void> {
  const result = await updateProfile(req.user!.sub, req.body)
  res.status(200).json(result)
}

export async function updateCardController(req: Request, res: Response): Promise<void> {
  const result = await updateCard(req.user!.sub, req.body)
  res.status(200).json(result)
}

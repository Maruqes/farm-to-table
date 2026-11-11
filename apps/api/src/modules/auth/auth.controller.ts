import type { Request, Response } from 'express'
import { login, register } from './auth.service.js'

export async function registerController(req: Request, res: Response): Promise<void> {
  const result = await register(req.body)
  res.status(201).json(result)
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const result = await login(req.body)
  res.status(200).json(result)
}

import type { Request, Response } from 'express'
import type { AdminContentPatchInput } from './admin-content.schemas.js'
import { listAdminContent, setContentHidden } from './admin-content.service.js'

export async function listAdminContentController(req: Request, res: Response): Promise<void> {
  res.json(await listAdminContent((req.query as { type: 'product' | 'producer' }).type))
}

export async function patchAdminContentController(req: Request, res: Response): Promise<void> {
  const { type, id } = req.params as { type: 'product' | 'producer', id: string }
  res.json(await setContentHidden(type, id, (req.body as AdminContentPatchInput).hidden))
}

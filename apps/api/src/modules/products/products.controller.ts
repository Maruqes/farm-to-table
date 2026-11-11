import type { Request, Response } from 'express'
import type { ListProductsQuery } from './products.schemas.js'
import { getProduct, listProducts } from './products.service.js'

export async function listProductsController(req: Request, res: Response): Promise<void> {
  res.json(await listProducts(req.query as ListProductsQuery))
}

export async function getProductController(req: Request, res: Response): Promise<void> {
  res.json(await getProduct(String(req.params.id)))
}

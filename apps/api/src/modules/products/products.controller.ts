import type { Request, Response } from 'express'
import type { ListProductsQuery, SaveProductInput } from './products.schemas.js'
import { createProduct, deleteProduct, getProduct, listOwnProducts, listProducts, updateProduct } from './products.service.js'

export async function listProductsController(req: Request, res: Response): Promise<void> {
  res.json(await listProducts(req.query as ListProductsQuery))
}

export async function getProductController(req: Request, res: Response): Promise<void> {
  res.json(await getProduct(String(req.params.id)))
}

export async function listOwnProductsController(req: Request, res: Response): Promise<void> {
  res.json(await listOwnProducts(req.user!.sub))
}

export async function createProductController(req: Request, res: Response): Promise<void> {
  const product = await createProduct(req.user!.sub, req.body as SaveProductInput)
  res.status(201).location(`/api/products/${product.id}`).json(product)
}

export async function updateProductController(req: Request, res: Response): Promise<void> {
  res.json(await updateProduct(req.user!.sub, String(req.params.id), req.body as SaveProductInput))
}

export async function deleteProductController(req: Request, res: Response): Promise<void> {
  await deleteProduct(req.user!.sub, String(req.params.id))
  res.status(204).end()
}

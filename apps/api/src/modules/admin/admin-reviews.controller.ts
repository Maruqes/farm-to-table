import type { Request, Response } from 'express'
import { hideAdminReview, keepAdminReview, listAdminReviews } from './admin-reviews.service.js'

export async function listAdminReviewsController(_req: Request, res: Response): Promise<void> {
  res.json(await listAdminReviews())
}

export async function keepAdminReviewController(req: Request, res: Response): Promise<void> {
  res.json(await keepAdminReview(String(req.params.id)))
}

export async function hideAdminReviewController(req: Request, res: Response): Promise<void> {
  res.json(await hideAdminReview(String(req.params.id)))
}

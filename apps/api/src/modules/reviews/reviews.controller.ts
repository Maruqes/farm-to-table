import type { Request, Response } from 'express'
import type { CreateReviewInput, ReportReviewInput } from './reviews.schemas.js'
import { createReview, listProducerReviews, reportReview } from './reviews.service.js'

export async function createReviewController(req: Request, res: Response): Promise<void> {
  const review = await createReview(req.user!.sub, req.body as CreateReviewInput)
  res.status(201).location(`/api/reviews/${review.id}`).json(review)
}

export async function listProducerReviewsController(req: Request, res: Response): Promise<void> {
  res.json(await listProducerReviews(req.user!.sub))
}

export async function reportReviewController(req: Request, res: Response): Promise<void> {
  const { reason } = req.body as ReportReviewInput
  res.json(await reportReview(req.user!.sub, String(req.params.id), reason))
}

import { USE_MOCKS } from '@/services/env'
import type { AdminReviewDto } from './admin-reviews.dto'
import { adminReviewsHttpService } from './admin-reviews.http'
import { adminReviewsMockService } from './admin-reviews.mock'

export interface AdminReviewsService {
  listReported(): Promise<AdminReviewDto[]>
  keep(id: string): Promise<AdminReviewDto>
  hide(id: string): Promise<AdminReviewDto>
}

export const adminReviewsService: AdminReviewsService = USE_MOCKS
  ? adminReviewsMockService
  : adminReviewsHttpService

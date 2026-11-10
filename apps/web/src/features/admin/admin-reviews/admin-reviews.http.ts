import { api } from '@/services/api'
import type { AdminReviewDto } from './admin-reviews.dto'
import type { AdminReviewsService } from './admin-reviews.service'

export const adminReviewsHttpService: AdminReviewsService = {
  async listReported(): Promise<AdminReviewDto[]> {
    return api<AdminReviewDto[]>('/admin/reviews?reported=true')
  },

  async keep(id: string): Promise<AdminReviewDto> {
    return api<AdminReviewDto>(
      `/admin/reviews/${encodeURIComponent(id)}/keep`,
      { method: 'POST' },
    )
  },

  async hide(id: string): Promise<AdminReviewDto> {
    return api<AdminReviewDto>(
      `/admin/reviews/${encodeURIComponent(id)}/hide`,
      { method: 'POST' },
    )
  },
}

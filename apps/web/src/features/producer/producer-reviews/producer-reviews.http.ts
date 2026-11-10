import { api } from '@/services/api'
import type {
  ProducerReviewDto,
  ReportReviewRequestDto,
} from './producer-reviews.dto'
import type { ProducerReviewsService } from './producer-reviews.service'

export const producerReviewsHttpService: ProducerReviewsService = {
  async listMine(): Promise<ProducerReviewDto[]> {
    return api<ProducerReviewDto[]>('/reviews?producer=me')
  },

  async report(id: string, reason: string): Promise<ProducerReviewDto> {
    const body: ReportReviewRequestDto = { reason }
    return api<ProducerReviewDto>(`/reviews/${encodeURIComponent(id)}/report`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

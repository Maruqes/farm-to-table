import { api } from '@/services/api'
import type {
  PendingProducerDto,
  RejectProducerRequestDto,
} from './admin-producers.dto'
import type { AdminProducersService } from './admin-producers.service'

export const adminProducersHttpService: AdminProducersService = {
  async listPending(): Promise<PendingProducerDto[]> {
    return api<PendingProducerDto[]>('/admin/producers?status=pending')
  },

  async approve(id: string): Promise<void> {
    await api<unknown>(`/admin/producers/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    })
  },

  async reject(id: string, reason?: string): Promise<void> {
    const body: RejectProducerRequestDto = {}
    const trimmed = reason?.trim()
    if (trimmed) body.reason = trimmed

    await api<unknown>(`/admin/producers/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

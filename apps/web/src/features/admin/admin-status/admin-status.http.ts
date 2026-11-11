import { api } from '@/services/api'
import type { AdminServiceStatusDto } from './admin-status.dto'
import type { AdminStatusService } from './admin-status.service'

export const adminStatusHttpService: AdminStatusService = {
  async getStatus(): Promise<AdminServiceStatusDto[]> {
    return api<AdminServiceStatusDto[]>('/admin/status')
  },
}

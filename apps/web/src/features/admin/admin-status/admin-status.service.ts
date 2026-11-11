import { USE_MOCKS } from '@/services/env'
import type { AdminServiceStatusDto } from './admin-status.dto'
import { adminStatusHttpService } from './admin-status.http'
import { adminStatusMockService } from './admin-status.mock'

export interface AdminStatusService {
  getStatus(): Promise<AdminServiceStatusDto[]>
}

export const adminStatusService: AdminStatusService = USE_MOCKS
  ? adminStatusMockService
  : adminStatusHttpService

// Domain model consumed by components and hooks. API shapes stay in admin-status.dto.ts.

export type AdminServiceState = 'operational' | 'degraded' | 'down'

export interface AdminServiceHealth {
  id: string
  service: string
  status: AdminServiceState
  detail: string
  latencyMs: number | null
}

// The panel refreshes itself at this interval; the mock mirrors the same wait.
export const ADMIN_STATUS_REFRESH_MS = 15_000

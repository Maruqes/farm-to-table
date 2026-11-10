// API shapes assumed by FE-25. Every field may be missing or renamed later.
// GET /api/admin/status -> AdminServiceStatusDto[] ; admin token required.
// `status` is operational|degraded|down. `latencyMs` is null when the service
// does not answer.

export interface AdminServiceStatusDto {
  service?: string
  status?: string
  detail?: string
  latencyMs?: number | null
}

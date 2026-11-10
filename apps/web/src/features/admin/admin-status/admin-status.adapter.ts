import type { AdminServiceStatusDto } from './admin-status.dto'
import {
  ADMIN_SERVICE_STATE_DETAILS,
  ADMIN_SERVICE_STATE_LABELS,
} from './admin-status.labels'
import type {
  AdminServiceHealth,
  AdminServiceState,
} from './admin-status.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asState(value: unknown): AdminServiceState {
  const status = asString(value).toLowerCase()
  return Object.prototype.hasOwnProperty.call(ADMIN_SERVICE_STATE_LABELS, status)
    ? (status as AdminServiceState)
    : 'degraded'
}

function asLatency(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.round(value))
}

function asId(service: string, index: number): string {
  const slug = service
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'service'}-${index}`
}

export function adaptAdminServiceHealth(
  dto: AdminServiceStatusDto | null | undefined,
  index = 0,
): AdminServiceHealth {
  const service = asString(dto?.service, `Service ${index + 1}`)
  const status = asState(dto?.status)

  return {
    id: asId(service, index),
    service,
    status,
    detail: asString(dto?.detail, ADMIN_SERVICE_STATE_DETAILS[status]),
    latencyMs: asLatency(dto?.latencyMs),
  }
}

export function adaptAdminServiceHealthList(
  dto: AdminServiceStatusDto[] | null | undefined,
): AdminServiceHealth[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((service, index) => adaptAdminServiceHealth(service, index))
}

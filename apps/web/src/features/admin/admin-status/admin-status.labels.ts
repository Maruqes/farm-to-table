import type { AdminServiceState } from './admin-status.types'

export const ADMIN_SERVICE_STATE_LABELS: Record<AdminServiceState, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}

export const ADMIN_SERVICE_STATE_ORDER: AdminServiceState[] = [
  'operational',
  'degraded',
  'down',
]

export const ADMIN_SERVICE_STATE_DETAILS: Record<AdminServiceState, string> = {
  operational: 'Responding normally.',
  degraded: 'Responding more slowly than usual.',
  down: 'Not responding.',
}

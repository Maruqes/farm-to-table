import type { AdminServiceStatusDto } from '../admin-status.dto'

// Service status fixtures for FE-25. Deterministic order and values keep the
// panel stable between renders; the mix covers all three states.
const services: AdminServiceStatusDto[] = [
  {
    service: 'API',
    status: 'operational',
    detail: 'REST requests are answered within the expected time.',
    latencyMs: 48,
  },
  {
    service: 'Socket.io',
    status: 'operational',
    detail: 'Live auction rooms and order notifications are connected.',
    latencyMs: 12,
  },
  {
    service: 'MongoDB',
    status: 'operational',
    detail: 'Reads and writes are completing normally.',
    latencyMs: 7,
  },
  {
    service: 'Image storage',
    status: 'degraded',
    detail: 'Uploads are slower than usual; retries are automatic.',
    latencyMs: 840,
  },
  {
    service: 'Swagger UI',
    status: 'down',
    detail: 'The documentation endpoint is not responding.',
    latencyMs: null,
  },
]

export function listMockServiceStatuses(): AdminServiceStatusDto[] {
  return services.map((service) => ({ ...service }))
}

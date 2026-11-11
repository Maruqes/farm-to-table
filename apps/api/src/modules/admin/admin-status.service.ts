import mongoose from 'mongoose'
import { env } from '../../config/env.js'
import { ping as storagePing } from '../../lib/storage.js'
import { connectedSockets } from '../../realtime/emit.js'

export type ServiceState = 'operational' | 'degraded' | 'down'

export interface ServiceStatus {
  service: string
  status: ServiceState
  detail: string
  latencyMs: number | null
}

const CHECK_TIMEOUT_MS = 2000
const DEGRADED_AFTER_MS = 1000

// Runs one check with a timeout: a failure or timeout is `down` with no
// latency; an answer slower than DEGRADED_AFTER_MS is `degraded`.
async function timed(service: string, downDetail: string, check: () => Promise<string>): Promise<ServiceStatus> {
  const started = Date.now()
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const detail = await Promise.race([
      check(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('check timed out')), CHECK_TIMEOUT_MS)
      }),
    ])
    const latencyMs = Date.now() - started
    if (latencyMs > DEGRADED_AFTER_MS) return { service, status: 'degraded', detail, latencyMs }
    return { service, status: 'operational', detail, latencyMs }
  } catch (err) {
    // The client gets a fixed sentence; the real cause stays server-side.
    console.error(`[admin-status] ${service} check failed:`, err instanceof Error ? err.message : err)
    return { service, status: 'down', detail: downDetail, latencyMs: null }
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}

async function checkApi(): Promise<string> {
  return 'API is running.'
}

async function checkSocket(): Promise<string> {
  const count = connectedSockets()
  return `${count} connected socket${count === 1 ? '' : 's'}.`
}

async function checkMongo(): Promise<string> {
  const db = mongoose.connection.db
  if (!db) throw new Error('mongo not connected')
  await db.admin().ping()
  return 'MongoDB answered the ping.'
}

async function checkStorage(): Promise<string> {
  const ok = await storagePing()
  if (!ok) throw new Error('storage ping failed')
  return 'Image storage is reachable.'
}

async function checkSwagger(): Promise<string> {
  // Built from config, never from the request. Down until BE-22 mounts /api-docs.
  const base = `http://127.0.0.1:${env.port}`
  for (const path of ['/api-docs/openapi.json', '/api-docs/']) {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(1500) })
    if (res.ok) return 'Swagger UI is available.'
  }
  throw new Error('swagger not available')
}

export async function getAdminStatus(): Promise<ServiceStatus[]> {
  return Promise.all([
    timed('API', 'API did not answer.', checkApi),
    timed('Socket.io', 'Socket.io did not answer.', checkSocket),
    timed('MongoDB', 'MongoDB did not answer.', checkMongo),
    timed('Image storage', 'Image storage did not answer.', checkStorage),
    timed('Swagger UI', 'Swagger UI is not available.', checkSwagger),
  ])
}

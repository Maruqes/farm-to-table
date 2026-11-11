import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../lib/api-error.js'

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
}

// Single CT-00 error printer: ApiError passes through, malformed JSON becomes
// 400 VALIDATION_ERROR, anything else becomes 500 INTERNAL_ERROR.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields !== undefined ? { fields: err.fields } : {}),
      },
    })
    return
  }
  const bodyError = err as { type?: unknown; status?: unknown } | null
  if (typeof bodyError?.type === 'string' && bodyError.type.startsWith('entity.')) {
    if (bodyError.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } })
      return
    }
    if (typeof bodyError.status === 'number' && bodyError.status >= 400 && bodyError.status < 500) {
      res.status(bodyError.status).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } })
      return
    }
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
}

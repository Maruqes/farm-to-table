import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'
import { ApiError } from '../lib/api-error.js'

interface ValidateSchemas {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
}

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      for (const key of ['body', 'query', 'params'] as const) {
        const schema = schemas[key]
        if (!schema) continue
        const result = schema.safeParse(req[key])
        if (!result.success) {
          const fields: Record<string, string> = {}
          for (const issue of result.error.issues) {
            const name = String(issue.path[0] ?? key)
            fields[name] ??= issue.message
          }
          throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', fields)
        }
        if (key === 'query') {
          // Express 5 defines req.query as a getter-only property, so assign via defineProperty.
          Object.defineProperty(req, 'query', {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
          })
        } else {
          req[key] = result.data
        }
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

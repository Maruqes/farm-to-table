import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../lib/api-error.js'
import { UserModel, type UserRole } from '../modules/users/users.model.js'

export interface AuthTokenUser {
  sub: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenUser
    }
  }
}

const ROLES: readonly UserRole[] = ['buyer', 'producer', 'admin']

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header')
    }
    const token = header.slice('Bearer '.length).trim()
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header')
    }
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as unknown
    if (typeof payload !== 'object' || payload === null) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
    }
    const { sub, role } = payload as { sub?: unknown, role?: unknown }
    if (typeof sub !== 'string' || sub.length === 0 || !isRole(role)) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
    }
    req.user = { sub, role }
    next()
  } catch (err) {
    if (err instanceof ApiError) {
      next(err)
      return
    }
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'))
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
      }
      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, 'FORBIDDEN', 'Forbidden')
      }
      next()
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError(403, 'FORBIDDEN', 'Forbidden'))
    }
  }
}

export async function requireApprovedProducer(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
    }
    if (req.user.role !== 'producer') {
      throw new ApiError(403, 'PRODUCER_NOT_APPROVED', 'Producer approval required')
    }
    const doc = await UserModel.findById(req.user.sub).select('role producer')
    if (!doc || doc.role !== 'producer' || doc.producer?.status !== 'approved') {
      throw new ApiError(403, 'PRODUCER_NOT_APPROVED', 'Producer approval required')
    }
    next()
  } catch (err) {
    if (err instanceof ApiError) {
      next(err)
      return
    }
    next(new ApiError(403, 'PRODUCER_NOT_APPROVED', 'Producer approval required'))
  }
}

function isRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { ApiError } from '../../lib/api-error.js'
import { UserModel, type ProducerStatus, type UserDoc, type UserRole } from '../users/users.model.js'
import type { LoginInput, RegisterInput } from './auth.schemas.js'

const BCRYPT_COST = 12
// Hash of a fixed dummy password so login always runs a bcrypt compare,
// even for unknown emails, and timing does not reveal which case failed.
const DUMMY_HASH = '$2b$12$hBNhXiK2gPK74tXc77Wsbue.mOpXl6t03qMrBMr0XS0fYonzqt6qe'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  producerStatus?: ProducerStatus
}

function toAuthUser(doc: { _id: unknown } & Pick<UserDoc, 'name' | 'email' | 'role' | 'producer'>): AuthUser {
  const user: AuthUser = {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  }
  if (doc.role === 'producer') {
    const status = doc.producer?.status
    user.producerStatus = status === 'pending' || status === 'approved' || status === 'rejected' ? status : 'pending'
  }
  return user
}

function signToken(sub: string, role: UserRole): string {
  return jwt.sign({ sub, role }, env.jwtSecret, { expiresIn: '2h', algorithm: 'HS256' })
}

export async function register(input: RegisterInput): Promise<{ user: AuthUser, token: string }> {
  if (input.role === 'producer' && (input.farmName === undefined || input.locality === undefined)) {
    const fields: Record<string, string> = {}
    if (input.farmName === undefined) fields.farmName = 'Farm name is required'
    if (input.locality === undefined) fields.locality = 'Locality is required'
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', fields)
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST)
  try {
    const doc = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      ...(input.role === 'producer'
        ? { producer: { farmName: input.farmName as string, status: 'pending', location: input.locality as string } }
        : {}),
    })
    const user = toAuthUser(doc)
    return { user, token: signToken(user.id, user.role) }
  } catch (err) {
    if (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { email: 'Already registered' })
    }
    throw err
  }
}

export async function login(input: LoginInput): Promise<{ user: AuthUser, token: string }> {
  const doc = await UserModel.findOne({ email: input.email }).select('+passwordHash')
  if (!doc) {
    await bcrypt.compare(input.password, DUMMY_HASH)
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }
  const ok = await bcrypt.compare(input.password, doc.passwordHash)
  if (!ok) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }
  const user = toAuthUser(doc)
  return { user, token: signToken(user.id, user.role) }
}

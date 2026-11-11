import { ApiError } from '../../lib/api-error.js'
import { UserModel, type CardEmbedded, type UserDoc } from './users.model.js'
import type { UpdateCardInput, UpdateProfileInput } from './users.schemas.js'

export interface ProfileCard {
  last4: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}

export interface Profile {
  id: string
  name: string
  email: string
  address: string
  card: ProfileCard | null
}

function toProfile(doc: { _id: unknown } & Pick<UserDoc, 'name' | 'email' | 'address' | 'role' | 'card'>): Profile {
  const card: ProfileCard | null =
    doc.role === 'buyer' && doc.card
      ? {
          last4: (doc.card as CardEmbedded).last4,
          holder: (doc.card as CardEmbedded).holder,
          expiry: (doc.card as CardEmbedded).expiry,
          simulateInvalid: (doc.card as CardEmbedded).simulateInvalid,
        }
      : null
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    address: doc.address ?? '',
    card,
  }
}

function luhnValid(digits: string): boolean {
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48
    if (d < 0 || d > 9) return false
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

function parseExpiry(expiry: string): { month: number, year: number } | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!match) return null
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return null
  return { month, year }
}

export function isCardExpired(expiry: string): boolean {
  const parsed = parseExpiry(expiry)
  if (!parsed) return true
  // Valid through the end of the expiry month.
  const endOfMonth = new Date(parsed.year, parsed.month, 0, 23, 59, 59, 999)
  return Date.now() > endOfMonth.getTime()
}

function validateCardInput(input: UpdateCardInput): { last4: string, holder: string, expiry: string } {
  const fields: Record<string, string> = {}
  const stripped = input.number.replace(/ /g, '')
  if (!/^\d{16}$/.test(stripped) || !luhnValid(stripped)) {
    fields.number = 'Invalid card number'
  }
  const holder = input.holder.trim()
  if (holder.length === 0) {
    fields.holder = 'Card holder is required'
  }
  if (!parseExpiry(input.expiry) || isCardExpired(input.expiry)) {
    fields.expiry = 'Invalid or expired expiry'
  }
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', fields)
  }
  return { last4: stripped.slice(-4), holder, expiry: input.expiry }
}

export async function getProfile(userId: string): Promise<Profile> {
  const doc = await UserModel.findById(userId)
  if (!doc) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found')
  }
  return toProfile(doc)
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const taken = await UserModel.findOne({ email: input.email, _id: { $ne: userId } }).select('_id')
  if (taken) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { email: 'Already registered' })
  }
  try {
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { name: input.name, email: input.email, address: input.address },
      { returnDocument: 'after' },
    )
    if (!doc) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found')
    }
    return toProfile(doc)
  } catch (err) {
    if (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { email: 'Already registered' })
    }
    throw err
  }
}

export async function updateCard(userId: string, input: UpdateCardInput): Promise<Profile> {
  const { last4, holder, expiry } = validateCardInput(input)
  const doc = await UserModel.findByIdAndUpdate(
    userId,
    { card: { last4, holder, expiry, simulateInvalid: input.simulateInvalid } },
    { returnDocument: 'after' },
  )
  if (!doc) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found')
  }
  return toProfile(doc)
}

export async function chargeCard(userId: string): Promise<boolean> {
  const doc = await UserModel.findById(userId).select('card')
  if (!doc || !doc.card) return false
  const card = doc.card as CardEmbedded
  if (card.simulateInvalid) return false
  if (isCardExpired(card.expiry)) return false
  return true
}

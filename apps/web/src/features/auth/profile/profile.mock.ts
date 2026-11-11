import { ApiError } from '@/services/api'
import { adaptProfile } from './profile.adapter'
import type { ProfileDto } from './profile.dto'
import { cardDigits, cardNumberError, expiryError } from './profile-validation'
import type { ProfileService } from './profile.service'

// Set localStorage[MOCK_PROFILE_ERROR_KEY] = '1' to make loading the profile fail.
export const MOCK_PROFILE_ERROR_KEY = 'ftt.mock.profileError'
const MOCK_LATENCY_MS = 500
const TAKEN_EMAIL = 'taken@example.com'

// In-memory per user: starts empty (no address, no card) and resets on reload.
const store = new Map<string, ProfileDto>()

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
}

function failFlagSet(): boolean {
  try {
    return localStorage.getItem(MOCK_PROFILE_ERROR_KEY) === '1'
  } catch {
    return false
  }
}

function current(seed: { id: string; name: string; email: string }): ProfileDto {
  let dto = store.get(seed.id)
  if (!dto) {
    dto = { id: seed.id, name: seed.name, email: seed.email, address: '', card: null }
    store.set(seed.id, dto)
  }
  return dto
}

function validation(fields: Record<string, string>): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', fields)
}

export const profileMockService: ProfileService = {
  async getProfile(seed) {
    await wait()
    if (failFlagSet()) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Could not load your profile.')
    }
    return adaptProfile(current(seed))
  },

  async updateProfile(seed, input) {
    await wait()
    if (input.email.trim().toLowerCase() === TAKEN_EMAIL) {
      throw validation({ email: 'Already registered' })
    }
    const dto = current(seed)
    dto.name = input.name.trim()
    dto.email = input.email.trim()
    dto.address = input.address.trim()
    return adaptProfile(dto)
  },

  async updateCard(seed, input) {
    await wait()
    const fields: Record<string, string> = {}
    const number = cardNumberError(input.number)
    if (number) fields.number = number
    const expiry = expiryError(input.expiry)
    if (expiry) fields.expiry = expiry
    if (!input.holder.trim()) fields.holder = 'Card holder is required.'
    if (Object.keys(fields).length > 0) throw validation(fields)

    const dto = current(seed)
    dto.card = {
      last4: cardDigits(input.number).slice(-4),
      holder: input.holder.trim(),
      expiry: input.expiry.trim(),
      simulateInvalid: input.simulateInvalid,
    }
    return adaptProfile(dto)
  },
}

import { ApiError } from '@/services/api'
import type { AuthSession, LoginInput, RegisterInput } from '@/types/auth'
import { adaptAuthSession } from './auth.adapter'
import type { AuthResponseDto, UserDto } from './auth.dto'
import type { AuthService } from './auth.service'
import { MOCK_USERS, type MockUserRecord } from './mocks/users'

const MOCK_LATENCY_MS = 600

// In-memory list: registrations live for the session only and reset on reload.
const users: MockUserRecord[] = MOCK_USERS.map((user) => ({ ...user }))
let nextUserId = users.length + 1

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function findUser(email: string): MockUserRecord | undefined {
  const normalised = email.trim().toLowerCase()
  return users.find((user) => user.email.toLowerCase() === normalised)
}

function toDto(user: MockUserRecord): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.producerStatus ? { producerStatus: user.producerStatus } : {}),
  }
}

function toResponse(user: MockUserRecord): AuthResponseDto {
  return { user: toDto(user), token: `mock-token-${user.id}` }
}

export const authMockService: AuthService = {
  async login(input: LoginInput): Promise<AuthSession> {
    await wait()
    const user = findUser(input.email)
    if (!user || user.password !== input.password) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    }
    return adaptAuthSession(toResponse(user))
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    await wait()
    const email = input.email.trim().toLowerCase()
    if (findUser(email)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', {
        email: 'Already registered',
      })
    }

    const user: MockUserRecord = {
      id: `user-${input.role}-${nextUserId}`,
      name: input.name.trim(),
      email,
      role: input.role,
      password: input.password,
      ...(input.role === 'producer' ? { producerStatus: 'pending' } : {}),
      ...(input.farmName ? { farmName: input.farmName } : {}),
      ...(input.locality ? { locality: input.locality } : {}),
    }
    nextUserId += 1
    users.push(user)
    return adaptAuthSession(toResponse(user))
  },
}

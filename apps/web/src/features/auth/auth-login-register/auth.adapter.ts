import type { AuthRole, AuthSession, AuthUser, ProducerStatus } from '@/types/auth'
import type { AuthResponseDto, UserDto } from './auth.dto'

function adaptRole(value: unknown): AuthRole {
  return value === 'producer' || value === 'admin' ? value : 'buyer'
}

function adaptProducerStatus(value: unknown): ProducerStatus | undefined {
  return value === 'pending' || value === 'approved' || value === 'rejected' ? value : undefined
}

export function adaptUser(dto: UserDto | null | undefined): AuthUser {
  const producerStatus = adaptProducerStatus(dto?.producerStatus)
  return {
    id: dto?.id || dto?._id || '',
    name: dto?.name?.trim() || 'User',
    email: dto?.email?.trim() ?? '',
    role: adaptRole(dto?.role),
    ...(producerStatus ? { producerStatus } : {}),
  }
}

export function adaptAuthSession(dto: AuthResponseDto | null | undefined): AuthSession {
  return {
    user: adaptUser(dto?.user),
    token: dto?.token ?? '',
  }
}

// Domain model consumed by components and hooks. API shapes stay in the feature's DTOs.
export type AuthRole = 'buyer' | 'producer' | 'admin'

export type ProducerStatus = 'pending' | 'approved' | 'rejected'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AuthRole
  producerStatus?: ProducerStatus
}

export interface AuthSession {
  user: AuthUser
  token: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  role: 'buyer' | 'producer'
  farmName?: string
  locality?: string
}

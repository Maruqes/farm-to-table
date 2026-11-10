import { createContext, useContext } from 'react'
import type { ProducerStatus } from '@/types/auth'

export type Role = 'visitor' | 'buyer' | 'producer' | 'admin'

export type AuthenticatedRole = Exclude<Role, 'visitor'>

export interface SessionUser {
  id: string
  name: string
  email: string
  role: AuthenticatedRole
  producerStatus?: ProducerStatus
}

export interface SessionContextValue {
  user: SessionUser | null
  role: Role
  isAuthenticated: boolean
  login: (role: AuthenticatedRole) => void
  signIn: (user: SessionUser, token: string) => void
  logout: () => void
  setRole: (role: Role) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used within a SessionProvider')
  return value
}

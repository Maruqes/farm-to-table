import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { setToken } from '@/services/api'
import { AUTHENTICATED_ROLES, MOCK_USERS } from './roles'
import { SessionContext, type AuthenticatedRole, type Role, type SessionUser } from './session'

const STORAGE_KEY = 'ftt.session'

function isAuthenticatedRole(value: unknown): value is AuthenticatedRole {
  return AUTHENTICATED_ROLES.some((role) => role === value)
}

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SessionUser> | null
    if (
      parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.name === 'string' &&
      isAuthenticatedRole(parsed.role)
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        email: typeof parsed.email === 'string' ? parsed.email : '',
        role: parsed.role,
        ...(parsed.producerStatus ? { producerStatus: parsed.producerStatus } : {}),
      }
    }
  } catch {
    // Ignore malformed or unavailable storage and start as a visitor.
  }
  return null
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStoredUser)

  // Dev role switcher identity; real authentication goes through signIn.
  const login = useCallback((role: AuthenticatedRole) => {
    const next = MOCK_USERS[role]
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const signIn = useCallback((nextUser: SessionUser, token: string) => {
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    setToken(token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  const setRole = useCallback(
    (role: Role) => {
      if (role === 'visitor') logout()
      else login(role)
    },
    [login, logout],
  )

  const value = useMemo(
    () => ({
      user,
      role: (user?.role ?? 'visitor') as Role,
      isAuthenticated: user !== null,
      login,
      signIn,
      logout,
      setRole,
    }),
    [user, login, signIn, logout, setRole],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

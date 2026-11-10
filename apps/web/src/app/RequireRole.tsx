import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession, type Role } from '@/context/session'

interface RequireRoleProps {
  roles: Role[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { role } = useSession()
  const location = useLocation()

  if (!roles.includes(role)) {
    return <Navigate to="/" replace state={{ redirectTo: location.pathname, denied: true }} />
  }

  return <>{children}</>
}

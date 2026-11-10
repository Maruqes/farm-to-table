import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '@/context/session'

interface RequireApprovedProducerProps {
  children: ReactNode
}

export function RequireApprovedProducer({ children }: RequireApprovedProducerProps) {
  const { user } = useSession()

  if (user?.role === 'producer' && user.producerStatus !== 'approved') {
    return <Navigate to="/producer/status" replace />
  }

  return <>{children}</>
}

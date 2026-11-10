import type { SessionUser } from '@/context/session'

export function postAuthPath(user: SessionUser): string {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'producer') {
    return user.producerStatus === 'approved' ? '/producer' : '/producer/status'
  }
  return '/'
}

import { MOCK_USERS, ROLE_LABELS } from '@/context/roles'
import { useSession, type Role } from '@/context/session'
import { Button } from '@/components/ui/button'
import type { ProducerStatus } from '@/types/auth'

const ROLES: Role[] = ['visitor', 'buyer', 'producer', 'admin']
const PRODUCER_STATUSES: ProducerStatus[] = ['pending', 'rejected']
const STATUS_LABELS: Record<string, string> = { pending: 'Pending producer', rejected: 'Rejected producer' }

export function DevRoleSwitcher() {
  const { role, user, setRole, signIn } = useSession()
  const status = user?.role === 'producer' ? user.producerStatus : undefined
  const isApprovedProducer = role === 'producer' && status === 'approved'

  return (
    <div className="dev-roles">
      <div className="container d-flex flex-wrap align-items-center gap-1 py-1 small">
        <span className="me-1 text-body-secondary">View as (dev)</span>
        {ROLES.map((item) => {
          const active = item === 'producer' ? isApprovedProducer : role === item
          return (
            <Button
              key={item}
              size="sm"
              variant={active ? 'default' : 'ghost'}
              aria-pressed={active}
              onClick={() => setRole(item)}
            >
              {ROLE_LABELS[item]}
            </Button>
          )
        })}
        {PRODUCER_STATUSES.map((item) => {
          const active = role === 'producer' && status === item
          return (
            <Button
              key={item}
              size="sm"
              variant={active ? 'default' : 'ghost'}
              aria-pressed={active}
              onClick={() => signIn({ ...MOCK_USERS.producer, producerStatus: item }, '')}
            >
              {STATUS_LABELS[item]}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

import { Ban, CircleCheck, CircleHelp, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  ADMIN_USER_ROLE_LABELS,
  ADMIN_USER_STATE_LABELS,
} from '../admin-users.labels'
import type { AdminUser, AdminUserState } from '../admin-users.types'

function UserStateBadge({ state }: { state: AdminUserState }) {
  const label = ADMIN_USER_STATE_LABELS[state]

  if (state === 'active') {
    return (
      <Badge variant="outline">
        <CircleCheck size={16} aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  if (state === 'pending') {
    return (
      <Badge variant="secondary">
        <Clock3 size={16} aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  if (state === 'suspended') {
    return (
      <Badge variant="secondary">
        <Ban size={16} aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <CircleHelp size={16} aria-hidden="true" />
      {label}
    </Badge>
  )
}

interface UsersTableProps {
  users: AdminUser[]
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <table className="table admin-table">
      <caption className="visually-hidden">
        Users with their name, email, role and account state
      </caption>
      <thead>
        <tr>
          <th scope="col">User</th>
          <th scope="col" className="d-none d-md-table-cell">
            Role
          </th>
          <th scope="col">State</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <th scope="row">
              <span className="d-block fw-semibold text-break">
                {user.name}
              </span>
              <span className="d-block small text-body-secondary text-break">
                {user.email || 'No email on file'}
              </span>
              <span className="d-block d-md-none mt-1">
                <Badge variant="outline">
                  {ADMIN_USER_ROLE_LABELS[user.role]}
                </Badge>
              </span>
            </th>
            <td className="d-none d-md-table-cell">
              <Badge variant="outline">
                {ADMIN_USER_ROLE_LABELS[user.role]}
              </Badge>
            </td>
            <td>
              <UserStateBadge state={user.state} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

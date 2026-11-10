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
        <CircleCheck aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  if (state === 'pending') {
    return (
      <Badge variant="secondary">
        <Clock3 aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  if (state === 'suspended') {
    return (
      <Badge variant="secondary">
        <Ban aria-hidden="true" />
        {label}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <CircleHelp aria-hidden="true" />
      {label}
    </Badge>
  )
}

interface UsersTableProps {
  users: AdminUser[]
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">
          Users with their name, email, role and account state
        </caption>
        <thead className="bg-muted/40 text-sm text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              User
            </th>
            <th
              scope="col"
              className="w-28 px-3 py-3 font-medium md:w-32"
            >
              Role
            </th>
            <th
              scope="col"
              className="w-32 px-3 py-3 font-medium"
            >
              State
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="align-top hover:bg-accent/40">
              <th scope="row" className="px-4 py-3 font-normal">
                <span className="block font-medium break-words">
                  {user.name}
                </span>
                <span className="block text-sm break-all text-muted-foreground">
                  {user.email || 'No email on file'}
                </span>
              </th>
              <td className="px-3 py-3">
                <Badge variant="outline">
                  {ADMIN_USER_ROLE_LABELS[user.role]}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <UserStateBadge state={user.state} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

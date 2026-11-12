import { useSession } from '@/context/session'
import { ROLE_LABELS } from '@/context/roles'
import { Badge } from '@/components/ui/badge'

export default function AccountPage() {
  const { user, role } = useSession()

  return (
    <section className="profile-column vstack gap-3">
      <h1 className="mb-0">My account</h1>
      <div className="rule vstack gap-2 pt-4">
        <p className="text-body-secondary mb-0">
          Signed in as <strong>{user?.name}</strong>
        </p>
        <p className="mb-0">
          <span className="label-line">Role</span>{' '}
          <Badge variant="outline">
            {ROLE_LABELS[role]}
          </Badge>
        </p>
        <p className="small text-body-secondary mb-0">
          Account details will be managed from your profile.
        </p>
      </div>
    </section>
  )
}

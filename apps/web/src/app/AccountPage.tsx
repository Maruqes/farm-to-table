import { useSession } from '@/context/session'
import { ROLE_LABELS } from '@/context/roles'
import { Badge } from '@/components/ui/badge'

export default function AccountPage() {
  const { user, role } = useSession()

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1>My account</h1>
      <div className="rule flex flex-col gap-2 pt-6">
        <p className="text-dim">
          Signed in as <strong>{user?.name}</strong>
        </p>
        <p>
          <span className="label-line">Role</span>{' '}
          <Badge variant="outline">
            {ROLE_LABELS[role]}
          </Badge>
        </p>
        <p className="text-sm text-dim">
          Account details will be managed from your profile.
        </p>
      </div>
    </section>
  )
}

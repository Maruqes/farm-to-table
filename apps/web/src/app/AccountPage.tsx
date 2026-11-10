import { useSession } from '@/context/session'
import { ROLE_LABELS } from '@/context/roles'

export default function AccountPage() {
  const { user, role } = useSession()

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">My account</h1>
      <p className="text-muted-foreground">
        Signed in as <strong>{user?.name}</strong> ({ROLE_LABELS[role]}).
      </p>
      <p className="text-sm text-muted-foreground">
        Account details will be managed from your profile.
      </p>
    </section>
  )
}

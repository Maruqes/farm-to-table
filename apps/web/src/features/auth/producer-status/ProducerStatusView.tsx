import { CircleAlert, Clock, LogOut } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import type { ProducerStatus } from '@/types/auth'

interface StatusContent {
  title: string
  body: string
  help: string
}

const STATUS_CONTENT: Record<Exclude<ProducerStatus, 'approved'>, StatusContent> = {
  pending: {
    title: 'Your producer account is waiting for approval',
    body: 'An admin reviews every new producer before they can sell on Farm to Table. Once your account is approved, you’ll be able to add products and create auctions.',
    help: 'There’s nothing else you need to do right now. You can log out and check back later.',
  },
  rejected: {
    title: 'Your producer account wasn’t approved',
    body: 'An admin reviewed your producer account and didn’t approve it, so you can’t sell products or run auctions on Farm to Table.',
    help: 'If you think this is a mistake, contact the site administrator and ask them to review your application again. If your account is approved later, log back in to get started.',
  },
}

export function ProducerStatusView() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const status = user?.role === 'producer' ? user.producerStatus : undefined

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (status === 'approved') {
    return <Navigate to="/producer" replace />
  }

  if (!status) {
    return (
      <div className="auth-column-wide py-4 py-md-5">
        <PageState
          error="missing-producer-status"
          errorMessage="We couldn’t find your producer status for this account. Log out and sign in again, or contact the site administrator."
        />
        <div className="mt-4 d-flex justify-content-center">
          <Button variant="outline" size="lg" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    )
  }

  const content = STATUS_CONTENT[status]
  const StatusIcon = status === 'pending' ? Clock : CircleAlert
  const iconClassName = status === 'pending' ? 'text-body-secondary' : 'text-danger'

  return (
    <section aria-labelledby="producer-status-title" className="auth-column-wide py-4 py-md-5">
      <p className="d-flex align-items-center gap-2 mb-0">
        <StatusIcon size={20} className={iconClassName} aria-hidden="true" />
        <Badge variant="outline">
          {status === 'pending' ? 'Pending' : 'Rejected'}
        </Badge>
      </p>
      <h1 id="producer-status-title" className="mt-4">
        {content.title}
      </h1>
      <div className="rule mt-4 pt-4 vstack gap-2 text-body-secondary">
        <p className="mb-0">{content.body}</p>
        <p className="mb-0">{content.help}</p>
      </div>
      <Button variant="outline" size="lg" className="mt-4" onClick={handleLogout}>
        <LogOut size={16} aria-hidden="true" />
        Log out
      </Button>
    </section>
  )
}

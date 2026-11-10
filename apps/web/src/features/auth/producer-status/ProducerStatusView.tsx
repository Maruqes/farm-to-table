import { CircleAlert, Clock, LogOut } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
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
      <div className="mx-auto max-w-xl py-8 md:py-12">
        <PageState
          error="missing-producer-status"
          errorMessage="We couldn’t find your producer status for this account. Log out and sign in again, or contact the site administrator."
        />
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="lg" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    )
  }

  const content = STATUS_CONTENT[status]
  const StatusIcon = status === 'pending' ? Clock : CircleAlert
  const iconClassName = status === 'pending' ? 'text-muted-foreground' : 'text-destructive'

  return (
    <section aria-labelledby="producer-status-title" className="mx-auto max-w-xl py-8 md:py-16">
      <StatusIcon className={cn('size-6', iconClassName)} aria-hidden="true" />
      <h1 id="producer-status-title" className="mt-4 text-3xl font-semibold md:text-4xl">
        {content.title}
      </h1>
      <div className="mt-4 space-y-3 text-muted-foreground">
        <p>{content.body}</p>
        <p>{content.help}</p>
      </div>
      <Button variant="outline" size="lg" className="mt-8" onClick={handleLogout}>
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </Button>
    </section>
  )
}

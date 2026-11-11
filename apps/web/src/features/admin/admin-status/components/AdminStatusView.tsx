import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/services/format'
import {
  ADMIN_STATUS_REFRESH_MS,
  type AdminServiceHealth,
} from '../admin-status.types'
import { useAdminStatus } from '../useAdminStatus'
import { ServiceStatusCard } from './ServiceStatusCard'

function summaryText(services: AdminServiceHealth[]): string {
  const total = services.length
  const down = services.filter((service) => service.status === 'down').length
  const degraded = services.filter(
    (service) => service.status === 'degraded',
  ).length
  const operational = total - down - degraded

  if (down > 0) {
    return `${down} ${down === 1 ? 'service is' : 'services are'} down; ${operational} of ${total} operational.`
  }

  if (degraded > 0) {
    return `${degraded} ${degraded === 1 ? 'service is' : 'services are'} degraded; ${operational} of ${total} operational.`
  }

  return total === 1
    ? 'The service is operational.'
    : `All ${total} services are operational.`
}

export function AdminStatusView() {
  const {
    services,
    loading,
    refreshing,
    error,
    refreshError,
    checkedAt,
    empty,
    reload,
  } = useAdminStatus()

  const seconds = ADMIN_STATUS_REFRESH_MS / 1000

  return (
    <section aria-labelledby="admin-status-heading" className="space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to admin overview
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 id="admin-status-heading">Service status</h1>
          <p className="max-w-[65ch] text-muted-foreground">
            Live health of the platform behind Farm to Table. The panel refreshes
            every {seconds} seconds, and you can check again at any time.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={reload}
            disabled={refreshing}
          >
            <RefreshCw
              className={refreshing ? 'animate-spin' : undefined}
              aria-hidden="true"
            />
            Refresh now
          </Button>

          <p className="text-xs text-muted-foreground">
            {refreshing && <span>Refreshing… </span>}
            {checkedAt ? (
              <>
                Last checked{' '}
                <time dateTime={checkedAt}>{formatDateTime(checkedAt)}</time>
              </>
            ) : (
              'Not checked yet.'
            )}
          </p>
        </div>
      </header>

      {refreshError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-muted-foreground">
            {refreshError} Showing the last successful check.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0"
            onClick={reload}
          >
            Try again
          </Button>
        </div>
      )}

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="No services reported. Refresh the panel; if it stays empty, check that the API is running."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {summaryText(services)}
          </p>

          <ul aria-label="Services" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceStatusCard service={service} />
              </li>
            ))}
          </ul>
        </div>
      </PageState>
    </section>
  )
}

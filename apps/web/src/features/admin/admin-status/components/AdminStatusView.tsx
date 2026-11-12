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
    <section aria-labelledby="admin-status-heading" className="flex flex-col gap-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-dim no-underline hover:text-ink hover:underline">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 id="admin-status-heading">Service status</h1>
          <p className="measure text-dim mb-0">
            Live health of the platform behind Farm to Table. The panel refreshes
            every {seconds} seconds, and you can check again at any time.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button
            type="button"
            variant="outline"
            onClick={reload}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'spin' : undefined}
              aria-hidden="true"
            />
            Refresh now
          </Button>

          <p className="text-sm text-dim mb-0">
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
          className="border-2 border-alarm p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <p className="text-sm text-dim mb-0">
            {refreshError} Showing the last successful check.
          </p>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
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
        <div className="flex flex-col gap-4">
          <p className="text-sm text-dim mb-0">
            {summaryText(services)}
          </p>

          <ul aria-label="Services" className="board mb-0">
            {services.map((service) => (
              <li key={service.id} className="border-b border-dim py-[0.7rem]">
                <ServiceStatusCard service={service} />
              </li>
            ))}
          </ul>
        </div>
      </PageState>
    </section>
  )
}

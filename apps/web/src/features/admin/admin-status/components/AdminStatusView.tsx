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
    <section aria-labelledby="admin-status-heading" className="vstack gap-4">
      <Link to="/admin" className="admin-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header className="d-flex flex-column flex-md-row align-items-md-end justify-content-md-between gap-3">
        <div>
          <h1 id="admin-status-heading">Service status</h1>
          <p className="measure text-body-secondary mb-0">
            Live health of the platform behind Farm to Table. The panel refreshes
            every {seconds} seconds, and you can check again at any time.
          </p>
        </div>

        <div className="d-flex flex-column flex-shrink-0 align-items-start align-items-md-end gap-2">
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

          <p className="small text-body-secondary mb-0">
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
          className="admin-alert d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3"
        >
          <p className="small text-body-secondary mb-0">
            {refreshError} Showing the last successful check.
          </p>
          <Button
            type="button"
            variant="outline"
            className="flex-shrink-0"
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
        <div className="vstack gap-3">
          <p className="small text-body-secondary mb-0">
            {summaryText(services)}
          </p>

          <ul aria-label="Services" className="board mb-0">
            {services.map((service) => (
              <li key={service.id} className="admin-service">
                <ServiceStatusCard service={service} />
              </li>
            ))}
          </ul>
        </div>
      </PageState>
    </section>
  )
}

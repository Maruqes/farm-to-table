import { useId } from 'react'
import {
  CircleCheck,
  CircleX,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ADMIN_SERVICE_STATE_LABELS } from '../admin-status.labels'
import type {
  AdminServiceHealth,
  AdminServiceState,
} from '../admin-status.types'

const STATE_ICONS: Record<AdminServiceState, LucideIcon> = {
  operational: CircleCheck,
  degraded: TriangleAlert,
  down: CircleX,
}

function ServiceStateBadge({ state }: { state: AdminServiceState }) {
  const Icon = STATE_ICONS[state]

  if (state === 'down') {
    return (
      <Badge variant="destructive">
        <Icon size={16} aria-hidden="true" />
        {ADMIN_SERVICE_STATE_LABELS[state]}
      </Badge>
    )
  }

  if (state === 'degraded') {
    return (
      <Badge variant="outline">
        <Icon size={16} aria-hidden="true" />
        {ADMIN_SERVICE_STATE_LABELS[state]}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      <Icon size={16} aria-hidden="true" />
      {ADMIN_SERVICE_STATE_LABELS[state]}
    </Badge>
  )
}

function Latency({ latencyMs }: { latencyMs: number | null }) {
  if (latencyMs === null) return <span>No response</span>

  return (
    <>
      <data value={latencyMs}>{latencyMs}</data> ms
    </>
  )
}

interface ServiceStatusCardProps {
  service: AdminServiceHealth
}

export function ServiceStatusCard({ service }: ServiceStatusCardProps) {
  const headingId = useId()

  return (
    <article aria-labelledby={headingId}>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <h2 id={headingId} className="min-w-0 text-break">
          {service.service}
        </h2>
        <ServiceStateBadge state={service.status} />
      </div>

      <p className="small text-body-secondary mt-1 mb-0">
        {service.detail}
      </p>

      <p className="d-flex align-items-baseline justify-content-between gap-3 small mt-2 mb-0">
        <span className="label-line">Latency</span>
        <span className="fw-semibold tabular">
          <Latency latencyMs={service.latencyMs} />
        </span>
      </p>
    </article>
  )
}

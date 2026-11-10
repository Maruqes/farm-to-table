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
        <Icon aria-hidden="true" />
        {ADMIN_SERVICE_STATE_LABELS[state]}
      </Badge>
    )
  }

  if (state === 'degraded') {
    return (
      <Badge variant="outline">
        <Icon aria-hidden="true" />
        {ADMIN_SERVICE_STATE_LABELS[state]}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      <Icon aria-hidden="true" />
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
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col rounded-xl border bg-card p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={headingId} className="min-w-0 break-words text-lg">
          {service.service}
        </h2>
        <ServiceStateBadge state={service.status} />
      </div>

      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {service.detail}
      </p>

      <dl className="mt-4 flex items-baseline justify-between gap-3 border-t pt-3 text-sm">
        <dt className="text-muted-foreground">Latency</dt>
        <dd className="font-medium tabular">
          <Latency latencyMs={service.latencyMs} />
        </dd>
      </dl>
    </article>
  )
}

import { formatDate } from '@/services/format'
import type {
  PendingProducer,
  PendingProducerDecision,
  ProducerDecision,
  ProducerDecisionResult,
} from '../admin-producers.types'
import { ProducerDecisionDialog } from './ProducerDecisionDialog'

interface PendingProducerRowProps {
  producer: PendingProducer
  pending: PendingProducerDecision | null
  onDecision: (
    producer: PendingProducer,
    action: ProducerDecision,
    reason?: string,
  ) => Promise<ProducerDecisionResult>
}

function PendingProducerRow({
  producer,
  pending,
  onDecision,
}: PendingProducerRowProps) {
  const busy = pending !== null
  const phoneHref = producer.phone
    ? `tel:${producer.phone.replace(/\s+/g, '')}`
    : ''

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center md:gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-semibold">{producer.name}</h2>

        {producer.bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {producer.bio}
          </p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {producer.categories.length > 0 && (
            <span>{producer.categories.join(' · ')}</span>
          )}
          {producer.email && (
            <a
              href={`mailto:${producer.email}`}
              className="break-words hover:text-foreground hover:underline"
            >
              {producer.email}
            </a>
          )}
          {producer.phone && (
            <a href={phoneHref} className="hover:text-foreground hover:underline">
              {producer.phone}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">
          Location
        </span>
        <span className="text-right md:text-left">{producer.location}</span>
      </div>

      <div className="flex items-baseline justify-between gap-3 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">
          Applied
        </span>
        {producer.appliedAt ? (
          <time
            dateTime={producer.appliedAt}
            className="text-right tabular md:text-left"
          >
            {formatDate(producer.appliedAt)}
          </time>
        ) : (
          <span className="text-right text-muted-foreground md:text-left">—</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
        <ProducerDecisionDialog
          producer={producer}
          action="approve"
          disabled={busy}
          onDecision={(reason) => onDecision(producer, 'approve', reason)}
        />
        <ProducerDecisionDialog
          producer={producer}
          action="reject"
          disabled={busy}
          onDecision={(reason) => onDecision(producer, 'reject', reason)}
        />
      </div>
    </li>
  )
}

interface PendingProducersListProps {
  producers: PendingProducer[]
  pending: PendingProducerDecision | null
  onDecision: (
    producer: PendingProducer,
    action: ProducerDecision,
    reason?: string,
  ) => Promise<ProducerDecisionResult>
}

export function PendingProducersList({
  producers,
  pending,
  onDecision,
}: PendingProducersListProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:gap-4"
      >
        <span>Producer</span>
        <span>Location</span>
        <span>Applied</span>
        <span className="text-right">Actions</span>
      </div>

      <ul
        aria-label="Producers waiting for approval"
        className="divide-y rounded-xl border bg-card md:rounded-t-none"
      >
        {producers.map((producer) => (
          <PendingProducerRow
            key={producer.id}
            producer={producer}
            pending={pending}
            onDecision={onDecision}
          />
        ))}
      </ul>
    </div>
  )
}

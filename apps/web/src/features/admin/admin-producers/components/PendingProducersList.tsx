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
    <li className="grid gap-3 border-b border-dim py-[0.7rem] md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center md:gap-4">
      <div className="min-w-0 flex flex-col gap-1">
        <h2 className="break-words font-sans text-base font-semibold normal-case leading-[1.4]">{producer.name}</h2>

        {producer.bio && (
          <p className="line-clamp-2 text-sm text-dim mb-0">
            {producer.bio}
          </p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-dim">
          {producer.categories.length > 0 && (
            <span>{producer.categories.join(' · ')}</span>
          )}
          {producer.email && (
            <a
              href={`mailto:${producer.email}`}
              className="break-words"
            >
              {producer.email}
            </a>
          )}
          {producer.phone && (
            <a href={phoneHref}>
              {producer.phone}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4 md:block">
        <span className="label-line md:hidden">
          Location
        </span>
        <span className="md:text-right">{producer.location}</span>
      </div>

      <div className="flex items-baseline justify-between gap-4 md:block">
        <span className="label-line md:hidden">
          Applied
        </span>
        {producer.appliedAt ? (
          <time
            dateTime={producer.appliedAt}
            className="md:text-right tabular"
          >
            {formatDate(producer.appliedAt)}
          </time>
        ) : (
          <span className="text-dim md:text-right">—</span>
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
        className="label-line hidden py-2 md:grid md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:gap-4"
      >
        <span>Producer</span>
        <span>Location</span>
        <span>Applied</span>
        <span className="text-right">Actions</span>
      </div>

      <ul
        aria-label="Producers waiting for approval"
        className="board"
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

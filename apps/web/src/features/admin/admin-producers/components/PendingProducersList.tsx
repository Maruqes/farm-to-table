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
    <li className="admin-producer-row">
      <div className="min-w-0 vstack gap-1">
        <h2 className="text-break">{producer.name}</h2>

        {producer.bio && (
          <p className="admin-clamp-2 small text-body-secondary mb-0">
            {producer.bio}
          </p>
        )}

        <div className="d-flex flex-wrap align-items-baseline column-gap-3 row-gap-1 small text-body-secondary">
          {producer.categories.length > 0 && (
            <span>{producer.categories.join(' · ')}</span>
          )}
          {producer.email && (
            <a
              href={`mailto:${producer.email}`}
              className="text-break"
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

      <div className="d-flex align-items-baseline justify-content-between gap-3 d-md-block">
        <span className="label-line d-md-none">
          Location
        </span>
        <span className="text-md-end">{producer.location}</span>
      </div>

      <div className="d-flex align-items-baseline justify-content-between gap-3 d-md-block">
        <span className="label-line d-md-none">
          Applied
        </span>
        {producer.appliedAt ? (
          <time
            dateTime={producer.appliedAt}
            className="text-md-end tabular"
          >
            {formatDate(producer.appliedAt)}
          </time>
        ) : (
          <span className="text-body-secondary text-md-end">—</span>
        )}
      </div>

      <div className="admin-decision-actions">
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
        className="admin-cols admin-producer-cols label-line"
      >
        <span>Producer</span>
        <span>Location</span>
        <span>Applied</span>
        <span className="text-end">Actions</span>
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

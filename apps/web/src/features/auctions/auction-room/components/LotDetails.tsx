import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, formatMoney } from '@/services/format'
import type { AuctionRoom } from '../auction-room.types'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="room-details-row border-bottom">
      <dt className="label-line">{label}</dt>
      <dd className="min-w-0 text-end small fw-semibold mb-0">{children}</dd>
    </div>
  )
}

export function LotDetails({ auction }: { auction: AuctionRoom }) {
  return (
    <section aria-labelledby="lot-details-heading" className="border-top pt-4">
      <h2 id="lot-details-heading" className="fs-4">
        Lot details
      </h2>

      <dl className="mt-2 mb-0">
        <Row label="Quantity">
          <span className="tabular">
            {auction.quantity} {auction.unit}
          </span>
        </Row>
        <Row label="Base price">
          <data value={auction.basePrice} className="tabular">
            {formatMoney(auction.basePrice)}
          </data>
        </Row>
        <Row label="Minimum increment">
          <data value={auction.increment} className="tabular">
            {formatMoney(auction.increment)}
          </data>
        </Row>
        <Row label="Producer">
          {auction.producer.id ? (
            <Link
              to={`/producers/${auction.producer.id}`}
              className="text-decoration-underline"
            >
              {auction.producer.name}
            </Link>
          ) : (
            auction.producer.name
          )}
        </Row>
        {auction.startsAt && (
          <Row label="Starts">
            <time dateTime={auction.startsAt}>{formatDateTime(auction.startsAt)}</time>
          </Row>
        )}
        {auction.endsAt && (
          <Row label={auction.status === 'ended' ? 'Ended' : 'Ends'}>
            <time dateTime={auction.endsAt}>{formatDateTime(auction.endsAt)}</time>
          </Row>
        )}
      </dl>
    </section>
  )
}

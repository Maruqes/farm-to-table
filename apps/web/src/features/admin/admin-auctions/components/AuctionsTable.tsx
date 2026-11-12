import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/services/format'
import { AUCTION_STATUS_LABELS } from '../admin-auctions.labels'
import type {
  AdminAuction,
  AdminAuctionStatus,
} from '../admin-auctions.types'

function AuctionStatusBadge({ status }: { status: AdminAuctionStatus }) {
  if (status === 'active') {
    return (
      <Badge variant="live">
        <span aria-hidden="true" className="admin-live-dot" />
        {AUCTION_STATUS_LABELS.active}
      </Badge>
    )
  }

  return (
    <Badge variant={status === 'ended' ? 'secondary' : 'outline'}>
      {AUCTION_STATUS_LABELS[status]}
    </Badge>
  )
}

function AuctionWhen({ auction }: { auction: AdminAuction }) {
  const isBeforeStart =
    auction.status === 'draft' || auction.status === 'scheduled'
  const label = isBeforeStart ? 'Starts' : 'Ends'
  const when = isBeforeStart ? auction.startsAt : auction.endsAt

  if (!when) {
    return <span>Not scheduled</span>
  }

  return (
    <>
      {label} <time dateTime={when}>{formatDateTime(when)}</time>
    </>
  )
}

function RoomLink({ auction }: { auction: AdminAuction }) {
  if (auction.status === 'draft') {
    return <span className="small text-body-secondary">Not published</span>
  }

  const label = auction.status === 'ended' ? 'View result' : 'Open room'

  return (
    <Link
      to={`/auctions/${encodeURIComponent(auction.id)}`}
      aria-label={`${label} for ${auction.productName}`}
      className="admin-room-link"
    >
      <ArrowUpRight size={16} aria-hidden="true" />
      {label}
    </Link>
  )
}

interface AuctionsTableProps {
  auctions: AdminAuction[]
}

export function AuctionsTable({ auctions }: AuctionsTableProps) {
  return (
    <table className="table admin-table">
      <caption className="visually-hidden">
        All auctions with product, producer, state, current price, bid count
        and a link to the room
      </caption>
      <thead>
        <tr>
          <th scope="col">Auction</th>
          <th scope="col" className="d-none d-md-table-cell">
            State
          </th>
          <th scope="col" className="text-end">
            Current price
          </th>
          <th scope="col" className="d-none d-md-table-cell text-end">
            Bids
          </th>
          <th scope="col">Room</th>
        </tr>
      </thead>
      <tbody>
        {auctions.map((auction) => (
          <tr key={auction.id}>
            <th scope="row">
              <span className="d-block fw-semibold text-break">
                {auction.productName}
              </span>
              <span className="d-block small text-body-secondary text-break">
                {auction.producerName}
              </span>
              <span className="d-block small text-body-secondary">
                <AuctionWhen auction={auction} />
              </span>
              <span className="d-block d-md-none mt-1">
                <AuctionStatusBadge status={auction.status} />
              </span>
              <span className="d-block small text-body-secondary d-md-none">
                <data value={auction.bidCount}>{auction.bidCount}</data>{' '}
                {auction.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            </th>
            <td className="d-none d-md-table-cell">
              <AuctionStatusBadge status={auction.status} />
            </td>
            <td className="text-end font-display text-nowrap tabular">
              <data value={auction.currentPrice}>
                {formatMoney(auction.currentPrice)}
              </data>
            </td>
            <td className="d-none d-md-table-cell text-end tabular">
              <data value={auction.bidCount}>{auction.bidCount}</data>
            </td>
            <td>
              <RoomLink auction={auction} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

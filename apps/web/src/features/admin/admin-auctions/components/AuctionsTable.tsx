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
        <span aria-hidden="true" className="inline-block size-1.5 flex-none bg-current" />
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
    return <span className="text-sm text-dim">Not published</span>
  }

  const label = auction.status === 'ended' ? 'View result' : 'Open room'

  return (
    <Link
      to={`/auctions/${encodeURIComponent(auction.id)}`}
      aria-label={`${label} for ${auction.productName}`}
      className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap text-sm font-semibold hover:underline"
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
    <table className="table">
      <caption className="sr-only">
        All auctions with product, producer, state, current price, bid count
        and a link to the room
      </caption>
      <thead>
        <tr>
          <th scope="col">Auction</th>
            <th scope="col" className="hidden md:table-cell">
            State
          </th>
          <th scope="col" className="text-right">
            Current price
          </th>
          <th scope="col" className="hidden md:table-cell text-right">
            Bids
          </th>
          <th scope="col">Room</th>
        </tr>
      </thead>
      <tbody>
        {auctions.map((auction) => (
          <tr key={auction.id}>
            <th scope="row" className="text-base font-normal normal-case tracking-normal text-ink">
              <span className="block font-semibold break-words">
                {auction.productName}
              </span>
              <span className="block text-sm text-dim break-words">
                {auction.producerName}
              </span>
              <span className="block text-sm text-dim">
                <AuctionWhen auction={auction} />
              </span>
              <span className="block md:hidden mt-1">
                <AuctionStatusBadge status={auction.status} />
              </span>
              <span className="block text-sm text-dim md:hidden">
                <data value={auction.bidCount}>{auction.bidCount}</data>{' '}
                {auction.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            </th>
            <td className="hidden md:table-cell">
              <AuctionStatusBadge status={auction.status} />
            </td>
            <td className="text-right font-display whitespace-nowrap tabular">
              <data value={auction.currentPrice}>
                {formatMoney(auction.currentPrice)}
              </data>
            </td>
            <td className="hidden md:table-cell text-right tabular">
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

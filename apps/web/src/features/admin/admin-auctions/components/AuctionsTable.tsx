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
      <Badge className="bg-live text-live-foreground">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
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
    return <span className="text-sm text-muted-foreground">Not published</span>
  }

  const label = auction.status === 'ended' ? 'View result' : 'Open room'

  return (
    <Link
      to={`/auctions/${encodeURIComponent(auction.id)}`}
      aria-label={`${label} for ${auction.productName}`}
      className="inline-flex h-10 items-center gap-1 whitespace-nowrap text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArrowUpRight className="size-4" aria-hidden="true" />
      {label}
    </Link>
  )
}

interface AuctionsTableProps {
  auctions: AdminAuction[]
}

export function AuctionsTable({ auctions }: AuctionsTableProps) {
  return (
    <>
      <ul aria-label="All auctions" className="space-y-3 md:hidden">
        {auctions.map((auction) => (
          <li key={auction.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium">{auction.productName}</p>
                <p className="break-words text-sm text-muted-foreground">
                  {auction.producerName}
                </p>
              </div>
              <AuctionStatusBadge status={auction.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Current price</dt>
                <dd className="font-display font-extrabold whitespace-nowrap tabular">
                  <data value={auction.currentPrice}>
                    {formatMoney(auction.currentPrice)}
                  </data>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bids</dt>
                <dd className="tabular">
                  <data value={auction.bidCount}>{auction.bidCount}</data>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">
                  {auction.status === 'draft' || auction.status === 'scheduled'
                    ? 'Start'
                    : 'End'}
                </dt>
                <dd>
                  <AuctionWhen auction={auction} />
                </dd>
              </div>
            </dl>

            <div className="mt-3">
              <RoomLink auction={auction} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            All auctions with product, producer, state, current price, bid count
            and a link to the room
          </caption>
          <thead className="bg-muted/40 text-sm text-muted-foreground">
            <tr>
              <th scope="col" className="w-[40%] px-4 py-3 font-medium">
                Auction
              </th>
              <th scope="col" className="w-[14%] px-3 py-3 font-medium">
                State
              </th>
              <th
                scope="col"
                className="w-[14%] px-3 py-3 text-right font-medium"
              >
                Current price
              </th>
              <th
                scope="col"
                className="w-[10%] px-3 py-3 text-right font-medium"
              >
                Bids
              </th>
              <th scope="col" className="w-[22%] px-3 py-3 font-medium">
                Room
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {auctions.map((auction) => (
              <tr key={auction.id} className="align-top hover:bg-accent/40">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="block break-words font-medium">
                    {auction.productName}
                  </span>
                  <span className="block break-words text-sm text-muted-foreground">
                    {auction.producerName}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    <AuctionWhen auction={auction} />
                  </span>
                </th>
                <td className="px-3 py-3">
                  <AuctionStatusBadge status={auction.status} />
                </td>
                <td className="px-3 py-3 text-right font-display font-extrabold whitespace-nowrap tabular">
                  <data value={auction.currentPrice}>
                    {formatMoney(auction.currentPrice)}
                  </data>
                </td>
                <td className="px-3 py-3 text-right tabular">
                  <data value={auction.bidCount}>{auction.bidCount}</data>
                </td>
                <td className="px-3 py-3">
                  <RoomLink auction={auction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

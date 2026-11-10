import type { AuctionListItem } from '../auctions-list.types'
import { AuctionCard } from './AuctionCard'

export function AuctionGrid({
  auctions,
  now,
}: {
  auctions: AuctionListItem[]
  now: number
}) {
  return (
    <ul role="list" className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} now={now} />
      ))}
    </ul>
  )
}

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
    <ul role="list" className="board">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} now={now} />
      ))}
    </ul>
  )
}

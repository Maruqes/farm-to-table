import type { AuctionListItemDto } from '../auctions-list.dto'

const MINUTE_MS = 60_000
const SECOND_MS = 1_000

function iso(now: number, offsetMs: number): string {
  return new Date(now + offsetMs).toISOString()
}

// Ids match the auction-room fixtures, so every card opens a real mock room.
export function createMockAuctionList(now = Date.now()): AuctionListItemDto[] {
  return [
    {
      id: 'auction-ending-soon',
      status: 'active',
      product: { id: 'prod-tomatoes', name: 'Tomatoes', category: 'vegetables' },
      currentPrice: 55,
      endsAt: iso(now, 75 * SECOND_MS),
      viewers: 11,
    },
    {
      id: 'auction-kiwi-lot',
      status: 'active',
      product: { id: 'prod-kiwi', name: 'Kiwi', category: 'fruit' },
      currentPrice: 120,
      endsAt: iso(now, 12 * MINUTE_MS),
      viewers: 9,
    },
    {
      id: 'auction-race-lot',
      status: 'active',
      product: { id: 'prod-olive-oil', name: 'Olive oil', category: 'vegetables' },
      currentPrice: 65,
      endsAt: iso(now, 15 * MINUTE_MS),
      viewers: 5,
    },
    {
      id: 'auction-own-lot',
      status: 'active',
      product: { id: 'prod-almonds', name: 'Almonds', category: 'fruit' },
      currentPrice: 80,
      endsAt: iso(now, 18 * MINUTE_MS),
      viewers: 4,
    },
    {
      id: 'auction-no-bids',
      status: 'active',
      product: { id: 'prod-chestnuts', name: 'Chestnuts', category: 'fruit' },
      currentPrice: 30,
      endsAt: iso(now, 20 * MINUTE_MS),
      viewers: 2,
    },
    {
      id: 'auction-scheduled',
      status: 'scheduled',
      product: { id: 'prod-heather-honey', name: 'Heather honey', category: 'honey' },
      currentPrice: 45,
      endsAt: iso(now, 90 * MINUTE_MS),
      viewers: 0,
    },
    {
      id: 'auction-ended',
      status: 'ended',
      product: {
        id: 'prod-serra-cheese',
        name: 'Serra da Estrela cheese',
        category: 'cheese',
      },
      currentPrice: 110,
      endsAt: iso(now, -5 * MINUTE_MS),
      viewers: 14,
    },
    {
      id: 'auction-ended-no-winner',
      status: 'ended',
      product: { id: 'prod-pumpkins', name: 'Pumpkins', category: 'vegetables' },
      currentPrice: 25,
      endsAt: iso(now, -10 * MINUTE_MS),
      viewers: 6,
    },
  ]
}

import type { AuctionSummaryDto } from '../catalog.dto'

const MINUTE_MS = 60_000

// Times are relative so the strip always shows a running countdown in mock mode.
export function createMockAuctions(now = Date.now()): AuctionSummaryDto[] {
  return [
    {
      id: 'auction-kiwi-lot',
      product: { id: 'prod-kiwi', name: 'Kiwi', category: 'fruit' },
      currentPrice: 120,
      endsAt: new Date(now + 12 * MINUTE_MS).toISOString(),
    },
    {
      id: 'auction-serra-cheese',
      product: { id: 'prod-serra-cheese', name: 'Serra da Estrela cheese', category: 'cheese' },
      currentPrice: 85,
      endsAt: new Date(now + 27 * MINUTE_MS).toISOString(),
    },
    {
      id: 'auction-heather-honey',
      product: { id: 'prod-heather-honey', name: 'Heather honey', category: 'honey' },
      currentPrice: 45,
      endsAt: new Date(now + 45 * MINUTE_MS).toISOString(),
    },
  ]
}

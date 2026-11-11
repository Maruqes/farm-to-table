import type { AuctionBidDto, AuctionRoomDto } from '../auction-room.dto'

const MINUTE_MS = 60_000
const SECOND_MS = 1_000

export const MOCK_AUCTION_IDS = {
  normal: 'auction-kiwi-lot',
  empty: 'auction-no-bids',
  error: 'auction-error',
  ended: 'auction-ended',
  noWinner: 'auction-ended-no-winner',
  scheduled: 'auction-scheduled',
  race: 'auction-race-lot',
  own: 'auction-own-lot',
  endingSoon: 'auction-ending-soon',
} as const

export const MOCK_AUCTION_ERROR_ID = MOCK_AUCTION_IDS.error
export const MOCK_AUCTION_RACE_ID = MOCK_AUCTION_IDS.race
export const MOCK_PRODUCER_ID = 'user-producer-1'

function iso(now: number, offsetMs: number): string {
  return new Date(now + offsetMs).toISOString()
}

function bid(
  id: string,
  amount: number,
  name: string,
  bidderId: string,
  date: string,
): AuctionBidDto {
  return { id, amount, name, bidderId, date }
}

export function createMockAuctionRooms(now = Date.now()): Record<string, AuctionRoomDto> {
  const rooms: Record<string, AuctionRoomDto> = {
    [MOCK_AUCTION_IDS.normal]: {
      id: MOCK_AUCTION_IDS.normal,
      status: 'active',
      product: { id: 'prod-kiwi', name: 'Kiwi', category: 'fruit' },
      producer: { id: 'producer-herdade-do-sol', name: 'Herdade do Sol' },
      quantity: 200,
      unit: 'kg',
      basePrice: 100,
      increment: 5,
      currentPrice: 120,
      leader: { id: 'buyer-marta', name: 'Marta Nunes' },
      startsAt: iso(now, -30 * MINUTE_MS),
      endsAt: iso(now, 12 * MINUTE_MS),
      bids: [
        bid('bid-kiwi-1', 105, 'Tomás Rocha', 'buyer-tomas', iso(now, -6 * MINUTE_MS)),
        bid('bid-kiwi-2', 110, 'Inês Costa', 'buyer-ines', iso(now, -5 * MINUTE_MS)),
        bid('bid-kiwi-3', 115, 'Tomás Rocha', 'buyer-tomas', iso(now, -3 * MINUTE_MS)),
        bid('bid-kiwi-4', 120, 'Marta Nunes', 'buyer-marta', iso(now, -2 * MINUTE_MS)),
      ],
      viewerCount: 9,
      winner: null,
    },

    [MOCK_AUCTION_IDS.empty]: {
      id: MOCK_AUCTION_IDS.empty,
      status: 'active',
      product: { id: 'prod-chestnuts', name: 'Chestnuts', category: 'fruit' },
      producer: { id: 'producer-sitio-da-ribeira', name: 'Sítio da Ribeira' },
      quantity: 50,
      unit: 'kg',
      basePrice: 30,
      increment: 2,
      currentPrice: 30,
      leader: null,
      startsAt: iso(now, -5 * MINUTE_MS),
      endsAt: iso(now, 20 * MINUTE_MS),
      bids: [],
      viewerCount: 2,
      winner: null,
    },

    [MOCK_AUCTION_IDS.ended]: {
      id: MOCK_AUCTION_IDS.ended,
      status: 'ended',
      product: { id: 'prod-serra-cheese', name: 'Serra da Estrela cheese', category: 'cheese' },
      producer: { id: 'producer-quinta-do-carvalhal', name: 'Quinta do Carvalhal' },
      quantity: 12,
      unit: 'wheels',
      basePrice: 80,
      increment: 5,
      currentPrice: 110,
      leader: { id: 'buyer-tomas', name: 'Tomás Rocha' },
      startsAt: iso(now, -95 * MINUTE_MS),
      endsAt: iso(now, -5 * MINUTE_MS),
      bids: [
        bid('bid-cheese-1', 85, 'Ana Silva', 'user-buyer-1', iso(now, -50 * MINUTE_MS)),
        bid('bid-cheese-2', 90, 'Marta Nunes', 'buyer-marta', iso(now, -42 * MINUTE_MS)),
        bid('bid-cheese-3', 95, 'Tomás Rocha', 'buyer-tomas', iso(now, -33 * MINUTE_MS)),
        bid('bid-cheese-4', 100, 'Inês Costa', 'buyer-ines', iso(now, -24 * MINUTE_MS)),
        bid('bid-cheese-5', 105, 'Marta Nunes', 'buyer-marta', iso(now, -14 * MINUTE_MS)),
        bid('bid-cheese-6', 110, 'Tomás Rocha', 'buyer-tomas', iso(now, -6 * MINUTE_MS)),
      ],
      viewerCount: 14,
      winner: { id: 'buyer-tomas', name: 'Tomás Rocha' },
    },

    [MOCK_AUCTION_IDS.noWinner]: {
      id: MOCK_AUCTION_IDS.noWinner,
      status: 'ended',
      product: { id: 'prod-pumpkins', name: 'Pumpkins', category: 'vegetables' },
      producer: { id: 'producer-herdade-do-sol', name: 'Herdade do Sol' },
      quantity: 80,
      unit: 'kg',
      basePrice: 25,
      increment: 2,
      currentPrice: 25,
      leader: null,
      startsAt: iso(now, -70 * MINUTE_MS),
      endsAt: iso(now, -10 * MINUTE_MS),
      bids: [],
      viewerCount: 6,
      winner: null,
    },

    [MOCK_AUCTION_IDS.scheduled]: {
      id: MOCK_AUCTION_IDS.scheduled,
      status: 'scheduled',
      product: { id: 'prod-heather-honey', name: 'Heather honey', category: 'honey' },
      producer: { id: 'producer-apiario-da-serra', name: 'Apiário da Serra' },
      quantity: 40,
      unit: 'jars',
      basePrice: 45,
      increment: 5,
      currentPrice: 45,
      leader: null,
      startsAt: iso(now, 30 * MINUTE_MS),
      endsAt: iso(now, 90 * MINUTE_MS),
      bids: [],
      viewerCount: 0,
      winner: null,
    },

    [MOCK_AUCTION_IDS.race]: {
      id: MOCK_AUCTION_IDS.race,
      status: 'active',
      product: { id: 'prod-olive-oil', name: 'Olive oil', category: 'vegetables' },
      producer: { id: 'producer-lagar-do-vale', name: 'Lagar do Vale' },
      quantity: 30,
      unit: 'litres',
      basePrice: 60,
      increment: 5,
      currentPrice: 65,
      leader: { id: 'buyer-rui', name: 'Rui Almeida' },
      startsAt: iso(now, -20 * MINUTE_MS),
      endsAt: iso(now, 15 * MINUTE_MS),
      bids: [bid('bid-oil-1', 65, 'Rui Almeida', 'buyer-rui', iso(now, -8 * MINUTE_MS))],
      viewerCount: 5,
      winner: null,
    },

    [MOCK_AUCTION_IDS.own]: {
      id: MOCK_AUCTION_IDS.own,
      status: 'active',
      product: { id: 'prod-almonds', name: 'Almonds', category: 'fruit' },
      producer: { id: MOCK_PRODUCER_ID, name: 'Quinta do Vale' },
      quantity: 25,
      unit: 'kg',
      basePrice: 70,
      increment: 5,
      currentPrice: 80,
      leader: { id: 'buyer-ines', name: 'Inês Costa' },
      startsAt: iso(now, -10 * MINUTE_MS),
      endsAt: iso(now, 18 * MINUTE_MS),
      bids: [
        bid('bid-almonds-1', 75, 'Rui Almeida', 'buyer-rui', iso(now, -6 * MINUTE_MS)),
        bid('bid-almonds-2', 80, 'Inês Costa', 'buyer-ines', iso(now, -3 * MINUTE_MS)),
      ],
      viewerCount: 4,
      winner: null,
    },

    [MOCK_AUCTION_IDS.endingSoon]: {
      id: MOCK_AUCTION_IDS.endingSoon,
      status: 'active',
      product: { id: 'prod-tomatoes', name: 'Tomatoes', category: 'vegetables' },
      producer: { id: 'producer-horta-da-fonte', name: 'Horta da Fonte' },
      quantity: 60,
      unit: 'kg',
      basePrice: 40,
      increment: 5,
      currentPrice: 55,
      leader: { id: 'user-buyer-1', name: 'Ana Silva' },
      startsAt: iso(now, -4 * MINUTE_MS),
      endsAt: iso(now, 75 * SECOND_MS),
      bids: [
        bid('bid-tomatoes-1', 45, 'Marta Nunes', 'buyer-marta', iso(now, -3 * MINUTE_MS)),
        bid('bid-tomatoes-2', 50, 'Rui Almeida', 'buyer-rui', iso(now, -2 * MINUTE_MS)),
        bid('bid-tomatoes-3', 55, 'Ana Silva', 'user-buyer-1', iso(now, -1 * MINUTE_MS)),
      ],
      viewerCount: 11,
      winner: null,
    },
  }

  return rooms
}

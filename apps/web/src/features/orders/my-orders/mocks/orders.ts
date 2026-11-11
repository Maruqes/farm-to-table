import type { MyOrderDto } from '../my-orders.dto'

// Buyer fixtures for FE-08. Ids are `order-<n>` so the realtime stub's fake
// `order-updated` events can move them through the timeline in mock mode.
export const MOCK_ORDERS: MyOrderDto[] = [
  {
    id: 'order-1',
    status: 'pending',
    producer: {
      id: 'producer-quinta-do-vale',
      name: 'Quinta do Vale',
      location: 'Douro, Portugal',
      email: 'orders@quintadovale.example',
      phone: '+351 254 000 101',
      lat: 41.1632,
      lng: -7.5435,
    },
    history: [{ status: 'pending', date: '2026-11-09T08:15:00.000Z' }],
    items: [
      { productId: 'prod-heirloom-tomatoes', name: 'Heirloom tomatoes', price: 3.5, quantity: 2, unit: 'kg' },
      { productId: 'prod-courgette', name: 'Courgette', price: 2.2, quantity: 1, unit: 'kg' },
    ],
    total: 9.2,
    reviewed: false,
  },
  {
    id: 'order-2',
    status: 'confirmed',
    producer: {
      id: 'producer-horta-da-ribeira',
      name: 'Horta da Ribeira',
      location: 'Ponte de Lima, Minho',
      email: 'hello@hortadaribeira.example',
      phone: '+351 258 000 202',
      lat: 41.7672,
      lng: -8.5839,
    },
    history: [
      { status: 'pending', date: '2026-11-07T09:40:00.000Z' },
      { status: 'confirmed', date: '2026-11-08T07:20:00.000Z' },
    ],
    items: [
      { productId: 'prod-kiwi', name: 'Kiwi', price: 2.4, quantity: 3, unit: 'kg' },
      { productId: 'prod-spring-greens', name: 'Spring greens', price: 1.8, quantity: 2, unit: 'bunch' },
    ],
    total: 10.8,
    reviewed: false,
  },
  {
    id: 'order-3',
    status: 'ready',
    producer: {
      id: 'producer-apiario-da-serra',
      name: 'Apiário da Serra',
      location: 'Manteigas, Serra da Estrela',
      email: 'mel@apiariodaserra.example',
      phone: '+351 275 000 303',
      lat: 40.3728,
      lng: -7.5398,
    },
    history: [
      { status: 'pending', date: '2026-11-05T10:00:00.000Z' },
      { status: 'confirmed', date: '2026-11-05T16:30:00.000Z' },
      { status: 'ready', date: '2026-11-06T08:10:00.000Z' },
    ],
    items: [
      { productId: 'prod-heather-honey', name: 'Heather honey', price: 8.5, quantity: 1, unit: 'jar' },
      { productId: 'prod-chestnut-honey', name: 'Chestnut honey', price: 9, quantity: 2, unit: 'jar' },
    ],
    total: 26.5,
    reviewed: false,
  },
  {
    id: 'order-4',
    status: 'delivered',
    producer: {
      id: 'producer-queijaria-da-beira',
      name: 'Queijaria da Beira',
      location: 'Seia, Serra da Estrela',
      email: 'queijos@queijariadabeira.example',
      phone: '+351 238 000 404',
      lat: 40.4224,
      lng: -7.7076,
    },
    history: [
      { status: 'pending', date: '2026-10-28T07:30:00.000Z' },
      { status: 'confirmed', date: '2026-10-28T14:05:00.000Z' },
      { status: 'ready', date: '2026-10-29T08:00:00.000Z' },
      { status: 'delivered', date: '2026-10-30T17:45:00.000Z' },
    ],
    items: [
      { productId: 'prod-serra-da-estrela', name: 'Serra da Estrela cheese', price: 14, quantity: 1, unit: 'wheel' },
    ],
    total: 14,
    reviewed: false,
  },
  {
    id: 'order-6',
    status: 'cancelled',
    producer: {
      id: 'producer-quinta-das-laranjeiras',
      name: 'Quinta das Laranjeiras',
      location: 'Silves, Algarve',
      email: 'citrus@laranjeiras.example',
      phone: '+351 282 000 606',
      lat: 37.1918,
      lng: -8.4386,
    },
    history: [
      { status: 'pending', date: '2026-11-04T09:10:00.000Z' },
      { status: 'cancelled', date: '2026-11-04T11:35:00.000Z' },
    ],
    items: [
      { productId: 'prod-winter-oranges', name: 'Winter oranges', price: 2.8, quantity: 4, unit: 'kg' },
    ],
    total: 11.2,
    reviewed: false,
  },
  {
    id: 'order-5',
    status: 'delivered',
    producer: {
      id: 'producer-pao-da-aldeia',
      name: 'Pão da Aldeia',
      location: 'Évora, Alentejo',
      email: 'pao@paodaaldeia.example',
      phone: '+351 266 000 505',
      lat: 38.5714,
      lng: -7.913,
    },
    history: [
      { status: 'pending', date: '2026-10-15T06:50:00.000Z' },
      { status: 'confirmed', date: '2026-10-15T10:05:00.000Z' },
      { status: 'ready', date: '2026-10-16T07:00:00.000Z' },
      { status: 'delivered', date: '2026-10-16T18:20:00.000Z' },
    ],
    items: [
      { productId: 'prod-sourdough', name: 'Sourdough loaf', price: 3.6, quantity: 2, unit: 'loaf' },
      { productId: 'prod-rye-loaf', name: 'Rye loaf', price: 4.1, quantity: 1, unit: 'loaf' },
    ],
    total: 11.3,
    reviewed: true,
    review: {
      rating: 5,
      text: 'The loaves were still warm when I collected them, and the rye kept beautifully for four days.',
    },
  },
]

export function createMockOrders(): MyOrderDto[] {
  return structuredClone(MOCK_ORDERS)
}

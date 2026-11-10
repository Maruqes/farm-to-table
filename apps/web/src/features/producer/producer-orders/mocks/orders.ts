import type { ProducerOrderDto } from '../producer-orders.dto'

const TOMATOES = { productId: 'prod-mock-heirloom-tomatoes', name: 'Heirloom tomatoes', price: 3.2, unit: 'kg' }
const SOURDOUGH = { productId: 'prod-mock-sourdough', name: 'Sourdough loaf', price: 3.6, unit: 'loaf' }
const HONEY = { productId: 'prod-mock-heather-honey', name: 'Heather honey', price: 8.5, unit: 'jar' }
const VINHO_VERDE = { productId: 'prod-mock-vinho-verde', name: 'Vinho Verde', price: 6.9, unit: 'bottle' }

// Producer fixtures for FE-14. Deterministic ids keep screenshots and tests stable.
export function createMockProducerOrders(): ProducerOrderDto[] {
  return [
    {
      id: 'FT-1042',
      status: 'pending',
      createdAt: '2026-11-10T08:20:00.000Z',
      updatedAt: '2026-11-10T08:20:00.000Z',
      buyer: {
        id: 'buyer-marta-ferreira',
        name: 'Marta Ferreira',
        email: 'marta.ferreira@example.com',
        phone: '+351 912 000 142',
      },
      fulfilment: 'pickup',
      items: [
        { ...TOMATOES, quantity: 2 },
        { ...SOURDOUGH, quantity: 1 },
      ],
      total: 10,
    },
    {
      id: 'FT-1041',
      status: 'pending',
      createdAt: '2026-11-10T07:05:00.000Z',
      updatedAt: '2026-11-10T07:05:00.000Z',
      buyer: {
        id: 'buyer-rui-costa',
        name: 'Rui Costa',
        email: 'rui.costa@example.com',
        phone: '+351 913 000 241',
      },
      fulfilment: 'delivery',
      address: {
        line1: 'Rua da Boavista 42',
        city: 'Porto',
        postalCode: '4050-107',
      },
      items: [
        { ...HONEY, quantity: 2 },
        { ...VINHO_VERDE, quantity: 1 },
      ],
      total: 23.9,
    },
    {
      id: 'FT-1039',
      status: 'confirmed',
      createdAt: '2026-11-09T15:40:00.000Z',
      updatedAt: '2026-11-09T17:10:00.000Z',
      buyer: {
        id: 'buyer-ines-almeida',
        name: 'Inês Almeida',
        email: 'ines.almeida@example.com',
        phone: '+351 914 000 339',
      },
      fulfilment: 'pickup',
      items: [
        { ...TOMATOES, quantity: 4 },
        { ...SOURDOUGH, quantity: 2 },
      ],
      total: 20,
    },
    {
      id: 'FT-1036',
      status: 'ready',
      createdAt: '2026-11-08T11:10:00.000Z',
      updatedAt: '2026-11-09T09:30:00.000Z',
      buyer: {
        id: 'buyer-tiago-santos',
        name: 'Tiago Santos',
        email: 'tiago.santos@example.com',
        phone: '+351 915 000 438',
      },
      fulfilment: 'delivery',
      address: {
        line1: 'Rua do Almada 88',
        city: 'Porto',
        postalCode: '4000-036',
      },
      items: [
        { ...SOURDOUGH, quantity: 3 },
        { ...HONEY, quantity: 1 },
      ],
      total: 19.3,
    },
    {
      id: 'FT-1031',
      status: 'delivered',
      createdAt: '2026-11-05T09:25:00.000Z',
      updatedAt: '2026-11-06T16:05:00.000Z',
      buyer: {
        id: 'buyer-beatriz-lopes',
        name: 'Beatriz Lopes',
        email: 'beatriz.lopes@example.com',
        phone: '+351 916 000 537',
      },
      fulfilment: 'pickup',
      items: [
        { ...TOMATOES, quantity: 2 },
        { ...HONEY, quantity: 1 },
      ],
      total: 14.9,
    },
    {
      id: 'FT-1028',
      status: 'cancelled',
      createdAt: '2026-11-03T18:00:00.000Z',
      updatedAt: '2026-11-03T18:30:00.000Z',
      buyer: {
        id: 'buyer-nuno-matos',
        name: 'Nuno Matos',
        email: 'nuno.matos@example.com',
        phone: '+351 917 000 636',
      },
      fulfilment: 'delivery',
      address: {
        line1: 'Avenida dos Combatentes 210',
        city: 'Porto',
        postalCode: '4200-154',
      },
      items: [{ ...VINHO_VERDE, quantity: 2 }],
      total: 13.8,
    },
  ]
}

const LIVE_BUYERS = [
  {
    id: 'buyer-sofia-martins',
    name: 'Sofia Martins',
    email: 'sofia.martins@example.com',
    phone: '+351 918 000 735',
  },
  {
    id: 'buyer-andre-ribeiro',
    name: 'André Ribeiro',
    email: 'andre.ribeiro@example.com',
    phone: '+351 919 000 834',
  },
  {
    id: 'buyer-carla-nunes',
    name: 'Carla Nunes',
    email: 'carla.nunes@example.com',
    phone: '+351 920 000 933',
  },
]

const LIVE_ADDRESSES = [
  { line1: 'Travessa do Carmo 15', city: 'Porto', postalCode: '4050-164' },
  { line1: 'Rua de Santa Catarina 301', city: 'Porto', postalCode: '4000-450' },
  { line1: 'Rua das Flores 120', city: 'Porto', postalCode: '4050-262' },
]

const LIVE_PRODUCTS = [TOMATOES, SOURDOUGH, HONEY, VINHO_VERDE]

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

// Used by the mock realtime client to simulate a buyer placing a new order.
export function createMockLiveOrder(sequence: number): ProducerOrderDto {
  const buyer = LIVE_BUYERS[sequence % LIVE_BUYERS.length]
  const product = LIVE_PRODUCTS[sequence % LIVE_PRODUCTS.length]
  const quantity = (sequence % 3) + 1
  const delivery = sequence % 2 === 0
  const now = new Date().toISOString()

  const order: ProducerOrderDto = {
    id: `FT-${1100 + sequence}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    buyer: { ...buyer },
    fulfilment: delivery ? 'delivery' : 'pickup',
    items: [{ ...product, quantity }],
    total: roundMoney(product.price * quantity),
  }

  if (delivery) {
    order.address = { ...LIVE_ADDRESSES[sequence % LIVE_ADDRESSES.length] }
  }

  return order
}

import {
  MOCK_PRODUCTS,
  type MockProductRecord,
} from '@/features/catalog/home-catalog/mocks/products'
import type {
  ProducerPublicDto,
  ProducerPublicProductDto,
} from '../producer-public.dto'

// Deterministic ids for the states the page must handle in mock mode.
export const MOCK_ERROR_PRODUCER_ID = 'producer-error'
export const MOCK_HIDDEN_PRODUCER_ID = 'producer-hidden'
export const MOCK_EMPTY_PRODUCER_ID = 'producer-quinta-da-figueira'

interface MockProducerRecord {
  id: string
  name: string
  bio: string
  location: string
  lat: number | null
  lng: number | null
  averageRating: number
  hidden?: boolean
}

const MOCK_PRODUCERS: MockProducerRecord[] = [
  {
    id: 'producer-quinta-do-vale',
    name: 'Quinta do Vale',
    bio: 'A family farm on the steep terraces above the Douro, growing tomatoes, walnuts and whatever the season allows. Everything is picked by hand and sold within a day of leaving the field.',
    location: 'Douro, Portugal',
    lat: 41.1632,
    lng: -7.5435,
    averageRating: 4.7,
  },
  {
    id: 'producer-horta-da-ribeira',
    name: 'Horta da Ribeira',
    bio: 'A small market garden in the Lima valley, worked without synthetic pesticides. We grow greens and fruit for the weekly market and send boxes straight from the plot.',
    location: 'Ponte de Lima, Minho',
    lat: 41.7672,
    lng: -8.5839,
    averageRating: 4.4,
  },
  {
    id: 'producer-apiario-da-serra',
    name: 'Apiário da Serra',
    bio: 'Beekeepers working the heather and chestnut groves high on the Serra da Estrela. The hives stay in the mountains all year, which gives the honey its dark colour and long finish.',
    location: 'Manteigas, Serra da Estrela',
    lat: 40.3728,
    lng: -7.5398,
    averageRating: 4.9,
  },
  {
    id: 'producer-adega-do-lima',
    name: 'Adega do Lima',
    bio: 'A tiny adega making Vinho Verde from old Loureiro vines. The wine is fermented slowly and bottled young, so it keeps the bright acidity and a light sparkle.',
    location: 'Ponte de Lima, Minho',
    lat: null,
    lng: null,
    averageRating: 4.4,
  },
  {
    id: 'producer-queijaria-da-beira',
    name: 'Queijaria da Beira',
    bio: 'Hand-made Serra da Estrela cheese from raw sheep milk and thistle rennet. Each small wheel is turned and washed by hand while it matures.',
    location: 'Seia, Serra da Estrela',
    lat: 40.4224,
    lng: -7.7076,
    averageRating: 4.8,
  },
  {
    id: 'producer-pao-da-aldeia',
    name: 'Pão da Aldeia',
    bio: 'A village bakery firing a wood oven every morning. The loaves are built on a slow sourdough starter and baked the same day they are sent.',
    location: 'Évora, Alentejo',
    lat: 38.5714,
    lng: -7.913,
    averageRating: 4.2,
  },
  {
    id: 'producer-quinta-das-laranjeiras',
    name: 'Quinta das Laranjeiras',
    bio: 'An orange grove in the Algarve hills, watered by the winter rain and picked to order. The fruit is left on the tree until the sugar is right.',
    location: 'Silves, Algarve',
    lat: 37.1918,
    lng: -8.4386,
    averageRating: 4.6,
  },
  {
    id: MOCK_EMPTY_PRODUCER_ID,
    name: 'Quinta da Figueira',
    bio: 'Fig trees and cork oaks on a quiet slope outside Beja. The first figs of the season are still ripening; there is nothing for sale just yet.',
    location: 'Beja, Alentejo',
    lat: 38.0153,
    lng: -7.8652,
    averageRating: 0,
  },
  {
    id: MOCK_HIDDEN_PRODUCER_ID,
    name: 'Quinta do Sossego',
    bio: 'This producer page is currently hidden by moderation.',
    location: 'Viseu, Dão',
    lat: 40.661,
    lng: -7.9097,
    averageRating: 4.1,
    hidden: true,
  },
]

function toProductDto(record: MockProductRecord): ProducerPublicProductDto {
  return {
    id: record.id,
    name: record.name,
    price: record.price,
    unit: record.unit,
    stock: record.stock,
    category: record.category,
    averageRating: record.averageRating,
    ...(record.imageUrl ? { imageUrl: record.imageUrl } : {}),
  }
}

export function createMockProducerPublic(id: string): ProducerPublicDto | null {
  const record = MOCK_PRODUCERS.find((producer) => producer.id === id)
  if (!record || record.hidden) return null

  return {
    id: record.id,
    name: record.name,
    bio: record.bio,
    location: record.location,
    averageRating: record.averageRating,
    products: MOCK_PRODUCTS.filter(
      (product) =>
        product.producer.id === record.id && product.approved && !product.hidden,
    ).map(toProductDto),
    ...(record.lat !== null ? { lat: record.lat } : {}),
    ...(record.lng !== null ? { lng: record.lng } : {}),
  }
}

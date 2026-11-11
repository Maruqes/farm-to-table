import type { ProducerDirectoryItemDto } from '../producers-directory.dto'

interface MockProducerDirectoryRecord {
  id: string
  name: string
  location: string
  averageRating: number | null
  productCount: number
}

const MOCK_PRODUCERS: MockProducerDirectoryRecord[] = [
  {
    id: 'producer-quinta-do-vale',
    name: 'Quinta do Vale',
    location: 'Douro, Portugal',
    averageRating: 4.7,
    productCount: 12,
  },
  {
    id: 'producer-horta-da-ribeira',
    name: 'Horta da Ribeira',
    location: 'Ponte de Lima, Minho',
    averageRating: 4.4,
    productCount: 8,
  },
  {
    id: 'producer-apiario-da-serra',
    name: 'Apiário da Serra',
    location: 'Manteigas, Serra da Estrela',
    averageRating: 4.9,
    productCount: 5,
  },
  {
    id: 'producer-adega-do-lima',
    name: 'Adega do Lima',
    location: 'Ponte de Lima, Minho',
    averageRating: 4.4,
    productCount: 6,
  },
  {
    id: 'producer-queijaria-da-beira',
    name: 'Queijaria da Beira',
    location: 'Seia, Serra da Estrela',
    averageRating: 4.8,
    productCount: 7,
  },
  {
    id: 'producer-pao-da-aldeia',
    name: 'Pão da Aldeia',
    location: 'Évora, Alentejo',
    averageRating: 4.2,
    productCount: 9,
  },
  {
    id: 'producer-quinta-das-laranjeiras',
    name: 'Quinta das Laranjeiras',
    location: 'Silves, Algarve',
    averageRating: 4.6,
    productCount: 11,
  },
  {
    id: 'producer-quinta-da-figueira',
    name: 'Quinta da Figueira',
    location: 'Beja, Alentejo',
    averageRating: null,
    productCount: 0,
  },
]

function toDto(record: MockProducerDirectoryRecord): ProducerDirectoryItemDto {
  return {
    id: record.id,
    name: record.name,
    location: record.location,
    averageRating: record.averageRating,
    productCount: record.productCount,
  }
}

export function listMockProducers(): ProducerDirectoryItemDto[] {
  return MOCK_PRODUCERS.map(toDto)
}

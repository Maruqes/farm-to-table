import type { ProducerPageDto } from '../producer-page-edit.dto'

// Mock-only record. A deterministic id keeps screenshots and tests stable.
export function createMockProducerPage(): ProducerPageDto {
  return {
    id: 'producer-quinta-do-vale',
    name: 'Quinta do Vale',
    bio: 'A family farm on the steep terraces above the Douro, growing tomatoes, walnuts and whatever the season allows. Everything is picked by hand and sold within a day of leaving the field.',
    location: 'Douro, Portugal',
    lat: 41.1632,
    lng: -7.5435,
  }
}

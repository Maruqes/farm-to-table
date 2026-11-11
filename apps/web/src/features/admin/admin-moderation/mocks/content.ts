import type { AdminContentItemDto } from '../admin-moderation.dto'

// Content fixtures for FE-21. Deterministic ids keep screenshots and tests stable.
export function createMockContent(): Record<'product' | 'producer', AdminContentItemDto[]> {
  return {
    product: [
      {
        id: 'product-1104',
        name: 'Serra da Estrela cheese',
        hidden: false,
      },
      {
        id: 'product-1098',
        name: 'Heirloom tomatoes',
        hidden: false,
      },
      {
        id: 'product-1091',
        name: 'Heather honey',
        hidden: true,
      },
      {
        id: 'product-1085',
        name: 'Sourdough loaf',
        hidden: false,
      },
      {
        id: 'product-1077',
        name: 'Douro red wine',
        hidden: false,
      },
      {
        id: 'product-1069',
        name: 'Goat cheese with herbs',
        hidden: true,
      },
    ],
    producer: [
      {
        id: 'producer-204',
        name: 'Quinta da Ribeira',
        hidden: false,
      },
      {
        id: 'producer-198',
        name: 'Queijaria do Castelo',
        hidden: false,
      },
      {
        id: 'producer-191',
        name: 'Apiário da Estrela',
        hidden: false,
      },
      {
        id: 'producer-187',
        name: 'Adega do Douro',
        hidden: true,
      },
    ],
  }
}

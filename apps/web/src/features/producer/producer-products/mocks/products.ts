import type { ProducerProductDto } from '../producer-products.dto'

// Mock-only records. Deterministic ids keep screenshots and tests stable.
export function createMockProducerProducts(): ProducerProductDto[] {
  return [
    {
      id: 'prod-mock-heirloom-tomatoes',
      name: 'Heirloom tomatoes',
      category: 'vegetables',
      price: 3.2,
      unit: 'kg',
      stock: 40,
      season: 'summer',
      organic: true,
    },
    {
      id: 'prod-mock-sourdough',
      name: 'Sourdough loaf',
      category: 'bakery',
      price: 3.6,
      unit: 'loaf',
      stock: 15,
      season: 'all-year',
      organic: false,
    },
    {
      id: 'prod-mock-heather-honey',
      name: 'Heather honey',
      category: 'honey',
      price: 8.5,
      unit: 'jar',
      stock: 18,
      season: 'all-year',
      organic: true,
    },
    {
      id: 'prod-mock-vinho-verde',
      name: 'Vinho Verde',
      category: 'wine',
      price: 6.9,
      unit: 'bottle',
      stock: 0,
      season: 'autumn',
      organic: false,
    },
  ]
}

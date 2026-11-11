import type { CartItemDto } from '../cart.dto'

// Cart fixtures. Kept inside the cart feature so the mock never depends on catalog internals.
export interface MockCartProduct {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  producer: {
    id: string
    name: string
    location: string
  }
}

export const MOCK_CART_PRODUCTS: MockCartProduct[] = [
  {
    id: 'prod-heirloom-tomatoes',
    name: 'Heirloom tomatoes',
    price: 3.2,
    unit: 'kg',
    stock: 40,
    category: 'vegetables',
    producer: {
      id: 'producer-quinta-do-vale',
      name: 'Quinta do Vale',
      location: 'Douro, Portugal',
    },
  },
  {
    id: 'prod-kiwi',
    name: 'Kiwi',
    price: 2.4,
    unit: 'kg',
    stock: 60,
    category: 'fruit',
    producer: {
      id: 'producer-horta-da-ribeira',
      name: 'Horta da Ribeira',
      location: 'Ponte de Lima, Minho',
    },
  },
  {
    id: 'prod-heather-honey',
    name: 'Heather honey',
    price: 8.5,
    unit: 'jar',
    stock: 18,
    category: 'honey',
    producer: {
      id: 'producer-apiario-da-serra',
      name: 'Apiário da Serra',
      location: 'Manteigas, Serra da Estrela',
    },
  },
  {
    id: 'prod-sourdough',
    name: 'Sourdough loaf',
    price: 3.6,
    unit: 'loaf',
    stock: 15,
    category: 'bakery',
    producer: {
      id: 'producer-pao-da-aldeia',
      name: 'Pão da Aldeia',
      location: 'Évora, Alentejo',
    },
  },
]

const SEED_LINES: { productId: string; quantity: number }[] = [
  { productId: 'prod-heirloom-tomatoes', quantity: 2 },
  { productId: 'prod-kiwi', quantity: 3 },
  { productId: 'prod-heather-honey', quantity: 1 },
  { productId: 'prod-sourdough', quantity: 2 },
]

export function createSeedCartItems(): CartItemDto[] {
  return SEED_LINES.flatMap((line) => {
    const product = MOCK_CART_PRODUCTS.find((entry) => entry.id === line.productId)
    if (!product) return []
    return [toCartItemDto(product, line.quantity)]
  })
}

export function toCartItemDto(product: MockCartProduct, quantity: number): CartItemDto {
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity,
    unit: product.unit,
    stock: product.stock,
    category: product.category,
    producer: product.producer,
  }
}

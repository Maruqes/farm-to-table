// Domain model consumed by components and hooks. API shapes stay in cart.dto.ts.

export interface CartProducer {
  id: string
  name: string
  location: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
  stock: number
  category: string
  imageUrl: string
  producer: CartProducer
}

export interface Cart {
  items: CartItem[]
}

export interface CartLineInput {
  productId: string
  quantity: number
}

export interface CartGroup {
  producer: CartProducer
  items: CartItem[]
  subtotal: number
}

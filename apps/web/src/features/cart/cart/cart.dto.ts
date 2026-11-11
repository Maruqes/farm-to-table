// API shapes assumed by FE-06. Every field may be missing or renamed later.
// GET /api/cart → { items } ; PUT /api/cart { items } → { items } ; 409 STOCK_CHANGED.
export interface CartProducerDto {
  id?: string
  _id?: string
  name?: string
  location?: string
}

export interface CartItemDto {
  productId?: string
  id?: string
  _id?: string
  name?: string
  price?: number
  quantity?: number
  unit?: string
  stock?: number
  category?: string
  imageUrl?: string
  producer?: CartProducerDto | null
}

export interface CartDto {
  items?: CartItemDto[] | null
}

export interface CartLineDto {
  productId: string
  quantity: number
}

export interface CartUpdateDto {
  items: CartLineDto[]
}

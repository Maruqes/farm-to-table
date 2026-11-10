// API shapes assumed by FE-13. Every field may be missing or renamed later.
// GET /api/products?producer=me -> ProducerProductDto[] ; producer token required.

export interface ProducerProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
  price?: number
  unit?: string
  stock?: number
  season?: string
  organic?: boolean
  imageUrl?: string
}

export interface SaveProducerProductRequestDto {
  name: string
  category: string
  price: number
  unit: string
  stock: number
  season: string
  organic: boolean
}

// POST /api/products/:id/image (multipart) -> 200
export interface ProducerProductImageDto {
  imageUrl?: string
}

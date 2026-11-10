// Domain model consumed by components. API shapes stay in producer-products.dto.ts.

export interface ProducerProduct {
  id: string
  name: string
  category: string
  price: number
  unit: string
  stock: number
  season: string
  organic: boolean
  imageUrl: string
}

export interface ProductInput {
  name: string
  category: string
  price: number
  unit: string
  stock: number
  season: string
  organic: boolean
}

export interface ProductFormValues {
  name: string
  category: string
  price: string
  unit: string
  stock: string
  season: string
  organic: boolean
}

export type ProductFieldErrors = Partial<
  Record<'name' | 'category' | 'price' | 'unit' | 'stock' | 'season' | 'image', string>
>

export interface SaveProductResult {
  product: ProducerProduct
  imageError: boolean
}

import mongoose from 'mongoose'

export const CATEGORIES = ['vegetables', 'fruit', 'honey', 'wine', 'cheese', 'bakery'] as const
export const UNITS = ['kg', 'bunch', 'jar', 'bottle', 'wheel', 'loaf'] as const
export const SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all-year'] as const

export interface ProductDoc {
  producer: mongoose.Types.ObjectId
  name: string
  description: string
  ingredients: string
  category: (typeof CATEGORIES)[number]
  price: number
  unit: (typeof UNITS)[number]
  stock: number
  season: (typeof SEASONS)[number]
  organic: boolean
  imageKey?: string
  hidden: boolean
  averageRating: number
  ratingCount: number
}

const productSchema = new mongoose.Schema(
  {
    producer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 0.01, max: 100000 },
    unit: { type: String, required: true, enum: UNITS },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    season: { type: String, required: true, enum: SEASONS },
    organic: { type: Boolean, required: true, default: false },
    imageKey: { type: String },
    hidden: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const ProductModel = mongoose.models.Product ?? mongoose.model<ProductDoc>('Product', productSchema)

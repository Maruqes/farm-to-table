import mongoose from 'mongoose'

export interface ReviewReportEmbedded {
  reason: string
  reportedAt: Date
  open: boolean
}

export interface ReviewDoc {
  order: mongoose.Types.ObjectId
  buyer: mongoose.Types.ObjectId
  producer: mongoose.Types.ObjectId
  products: mongoose.Types.ObjectId[]
  productName: string | null
  rating: number
  text: string
  hidden: boolean
  report?: ReviewReportEmbedded | null
  createdAt: Date
  updatedAt: Date
}

const reviewReportSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    reportedAt: { type: Date, required: true },
    open: { type: Boolean, required: true, default: true },
  },
  { _id: false },
)

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    producer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    products: { type: [mongoose.Schema.Types.ObjectId], ref: 'Product', default: [] },
    productName: { type: String, default: null, required: false },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    text: { type: String, default: '', trim: true },
    hidden: { type: Boolean, default: false },
    report: { type: reviewReportSchema, default: null, required: false },
  },
  { timestamps: true },
)

export const ReviewModel = mongoose.model<ReviewDoc>('Review', reviewSchema)

import mongoose from 'mongoose'

export const AUCTION_STATUSES = ['draft', 'scheduled', 'active', 'ended'] as const
export type AuctionStatus = (typeof AUCTION_STATUSES)[number]

// Statuses a public read may expose; `draft` and cancelled auctions stay private.
export const PUBLIC_AUCTION_STATUSES = ['scheduled', 'active', 'ended'] as const
export type PublicAuctionStatus = (typeof PUBLIC_AUCTION_STATUSES)[number]

export interface AuctionPersonEmbedded {
  id: mongoose.Types.ObjectId
  name: string
}

export interface AuctionDoc {
  producer: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  productName: string
  category: string
  unit: string
  quantity: number
  basePrice: number
  increment: number
  durationMinutes: number
  startsAt: Date
  endsAt: Date
  status: AuctionStatus
  cancelled: boolean
  currentPrice: number
  bidCount: number
  leader: AuctionPersonEmbedded | null
  winner: AuctionPersonEmbedded | null
  lastViewers: number
  settledAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const auctionPersonSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  },
  { _id: false },
)

const auctionSchema = new mongoose.Schema(
  {
    producer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    basePrice: { type: Number, required: true, min: 0.01 },
    increment: { type: Number, required: true, min: 0.01 },
    durationMinutes: { type: Number, required: true, min: 5, max: 1440, validate: Number.isInteger },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: AUCTION_STATUSES, default: 'draft', required: true },
    cancelled: { type: Boolean, default: false },
    currentPrice: { type: Number, required: true, min: 0 },
    bidCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    leader: { type: auctionPersonSchema, default: null, required: false },
    winner: { type: auctionPersonSchema, default: null, required: false },
    lastViewers: { type: Number, default: 0, min: 0 },
    // Set by BE-16 after settlement; deliberately absent until then.
    settledAt: { type: Date, required: false },
  },
  { timestamps: true },
)

auctionSchema.index({ status: 1, endsAt: 1 })
auctionSchema.index({ status: 1, startsAt: 1 })

export const AuctionModel = mongoose.model<AuctionDoc>('Auction', auctionSchema)

import mongoose from 'mongoose'

export interface BidDoc {
  auction: mongoose.Types.ObjectId
  bidder: mongoose.Types.ObjectId
  name: string
  amount: number
  createdAt: Date
}

const bidSchema = new mongoose.Schema(
  {
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true, index: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const BidModel = mongoose.model<BidDoc>('Bid', bidSchema)

import mongoose from 'mongoose'

export type UserRole = 'buyer' | 'producer' | 'admin'
export type ProducerStatus = 'pending' | 'approved' | 'rejected'

export interface ProducerEmbedded {
  farmName: string
  status: ProducerStatus
  bio: string
  location: string
  lat?: number
  lng?: number
  photoUrl: string
  hidden: boolean
  rejectReason: string
}

export interface CartItem {
  product: mongoose.Types.ObjectId
  quantity: number
}

export interface CardEmbedded {
  last4: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}

export interface UserDoc {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  address: string
  card: CardEmbedded | null
  cart: CartItem[]
  producer?: ProducerEmbedded
}

const producerSchema = new mongoose.Schema(
  {
    farmName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
    photoUrl: { type: String, default: '' },
    hidden: { type: Boolean, default: false },
    rejectReason: { type: String, default: '' },
  },
  { _id: false },
)

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['buyer', 'producer', 'admin'] },
  address: { type: String, default: '' },
  card: {
    type: new mongoose.Schema(
      {
        last4: { type: String, required: true },
        holder: { type: String, required: true },
        expiry: { type: String, required: true },
        simulateInvalid: { type: Boolean, required: true, default: false },
      },
      { _id: false },
    ),
    default: null,
    required: false,
  },
  cart: { type: [cartItemSchema], default: [] },
  producer: { type: producerSchema, required: false },
})

export const UserModel = mongoose.model<UserDoc>('User', userSchema)

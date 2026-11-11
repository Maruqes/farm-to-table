import mongoose from 'mongoose'
import { env } from '../config/env.js'

// Every document serialises with string `id` and without `_id` / `__v` (CT-00).
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id)
      delete ret._id
      delete ret.__v
      return ret
    },
  })
})

export async function connect(): Promise<void> {
  await mongoose.connect(env.mongoUrl)
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect()
}

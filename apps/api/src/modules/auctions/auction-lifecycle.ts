import mongoose from 'mongoose'
import { emitToAuction, emitToUser, viewerCount } from '../../realtime/emit.js'
import { notify } from '../notifications/notifications.service.js'
import { createOrder, decrementStock } from '../orders/orders.service.js'
import { ProductModel } from '../products/products.model.js'
import { chargeCard } from '../users/users.service.js'
import { UserModel } from '../users/users.model.js'
import { AuctionModel, type AuctionDoc } from './auctions.model.js'
import { BidModel, type BidDoc } from './bids.model.js'

type AuctionRow = AuctionDoc & { _id: mongoose.Types.ObjectId }
type BidRow = BidDoc & { _id: mongoose.Types.ObjectId }

interface Candidate {
  id: string
  name: string
  amount: number
}

interface Person {
  id: string
  name: string
}

const CLOSE_LAG_MS = 10_000
const TICK_MS = 1_000

// Highest bid per distinct bidder, highest first; later bids by the same bidder replace earlier ones.
async function highestBids(auctionId: mongoose.Types.ObjectId): Promise<Candidate[]> {
  const bids: BidRow[] = await BidModel.find({ auction: auctionId }).sort({ amount: -1, _id: -1 }).lean()
  const seen = new Set<string>()
  const candidates: Candidate[] = []
  for (const bid of bids) {
    const id = String(bid.bidder)
    if (seen.has(id)) continue
    seen.add(id)
    candidates.push({ id, name: bid.name, amount: bid.amount })
  }
  return candidates
}

// One line for the whole lot: total is the winning bid and a later cancel restores the lot quantity.
function lotItem(auction: AuctionRow, amount: number) {
  return {
    productId: String(auction.product),
    name: auction.productName,
    price: amount / auction.quantity,
    quantity: auction.quantity,
    unit: auction.unit,
  }
}

async function emitOrderCreated(auction: AuctionRow, winner: Candidate, order: Awaited<ReturnType<typeof createOrder>>): Promise<void> {
  const buyer = await UserModel.findById(winner.id).select('email').lean()
  emitToUser(String(auction.producer), 'order-created', {
    id: String(order._id),
    status: order.status,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
    buyer: { id: winner.id, name: winner.name, ...(buyer?.email ? { email: buyer.email } : {}) },
    items: order.items.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
    })),
    total: order.total,
    fulfilment: order.fulfilment,
    address: null,
  })
}

async function settleAuction(auction: AuctionRow): Promise<void> {
  let winner: Person | null = auction.winner
    ? { id: String(auction.winner.id), name: auction.winner.name }
    : null

  if (!winner) {
    const candidates = await highestBids(auction._id)
    for (const candidate of candidates) {
      if (!(await chargeCard(candidate.id))) {
        await notify(candidate.id, 'auction-skipped', `Your card was declined, so your bid for ${auction.productName} was skipped`)
        continue
      }

      if (!(await decrementStock(String(auction.product), auction.quantity))) {
        await notify(candidate.id, 'auction-skipped', `${auction.productName} is no longer available`)
        break
      }

      let order: Awaited<ReturnType<typeof createOrder>>
      try {
        order = await createOrder({
          buyer: candidate.id,
          producer: String(auction.producer),
          items: [lotItem(auction, candidate.amount)],
          fulfilment: 'pickup',
          auction: String(auction._id),
        })
      } catch (err) {
        await ProductModel.updateOne({ _id: auction.product }, { $inc: { stock: auction.quantity } })
        throw err
      }

      winner = { id: candidate.id, name: candidate.name }
      await AuctionModel.updateOne(
        { _id: auction._id, status: 'ended' },
        { $set: { winner: { id: new mongoose.Types.ObjectId(candidate.id), name: candidate.name } } },
      )
      await notify(candidate.id, 'auction-won', `You won ${auction.productName} for €${candidate.amount.toFixed(2)}`)
      await notify(String(auction.producer), 'order-new', `${candidate.name} won the auction for ${auction.productName}`)
      await emitOrderCreated(auction, candidate, order)
      break
    }
  }

  emitToAuction(String(auction._id), 'auction-ended', {
    auctionId: String(auction._id),
    status: 'ended',
    winner,
    currentPrice: auction.currentPrice,
  })

  await AuctionModel.updateOne(
    { _id: auction._id, status: 'ended', settledAt: null },
    { $set: { settledAt: new Date() } },
  )
}

async function closeDue(now: Date): Promise<void> {
  const due: Record<string, unknown> = { status: 'active', cancelled: { $ne: true }, endsAt: { $lte: now } }
  for (;;) {
    const next = (await AuctionModel.findOne(due).sort({ endsAt: 1, _id: 1 }).select('_id').lean()) as { _id: mongoose.Types.ObjectId } | null
    if (!next) return

    const claimed: AuctionRow | null = await AuctionModel.findOneAndUpdate(
      { _id: next._id, ...due },
      { $set: { status: 'ended', lastViewers: viewerCount(String(next._id)) } },
      { returnDocument: 'after' },
    ).lean()
    if (claimed) await settleAuction(claimed)
  }
}

// Only the tick that bumps updatedAt away from the stale window may settle the auction.
async function recoverStale(now: Date): Promise<void> {
  const stale: Record<string, unknown> = {
    status: 'ended',
    cancelled: { $ne: true },
    settledAt: null,
    updatedAt: { $lte: new Date(now.getTime() - CLOSE_LAG_MS) },
  }
  for (;;) {
    const next = (await AuctionModel.findOne(stale).sort({ endsAt: 1, _id: 1 }).select('_id').lean()) as { _id: mongoose.Types.ObjectId } | null
    if (!next) return

    const claimed: AuctionRow | null = await AuctionModel.findOneAndUpdate(
      { _id: next._id, ...stale },
      { $set: { lastViewers: viewerCount(String(next._id)), updatedAt: new Date() } },
      { returnDocument: 'after' },
    ).lean()
    if (claimed) await settleAuction(claimed)
  }
}

export async function tick(now: Date = new Date()): Promise<void> {
  await AuctionModel.updateMany(
    { status: 'scheduled', startsAt: { $lte: now } },
    { $set: { status: 'active' } },
  )
  await closeDue(now)
  await recoverStale(now)
}

let timer: NodeJS.Timeout | null = null
let running = false

export function startScheduler(): NodeJS.Timeout {
  if (!timer) {
    timer = setInterval(() => {
      if (running) return
      running = true
      tick()
        .catch((err: unknown) => console.error('auction tick failed', err))
        .finally(() => {
          running = false
        })
    }, TICK_MS)
  }
  return timer
}

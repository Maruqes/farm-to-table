import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { round2 } from '../../lib/money.js'
import { viewerCount } from '../../realtime/emit.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'
import {
  AuctionModel,
  type AuctionDoc,
  type AuctionPersonEmbedded,
  type AuctionStatus,
  type PublicAuctionStatus,
} from './auctions.model.js'
import { BidModel, type BidDoc } from './bids.model.js'
import type { ListAuctionsQuery, SaveAuctionInput } from './auctions.schemas.js'

const BIDS_LIMIT = 50
const DRAFT = 'draft'

type AuctionRow = AuctionDoc & { _id: mongoose.Types.ObjectId }
type BidRow = BidDoc & { _id: mongoose.Types.ObjectId }

export interface AuctionListDto {
  id: string
  product: { id: string, name: string, category: string }
  currentPrice: number
  endsAt: string
  viewers: number
  status: PublicAuctionStatus
}

export interface AuctionBidDto {
  id: string
  amount: number
  name: string
  bidderId: string
  date: string
}

export interface AuctionRoomDto {
  id: string
  status: PublicAuctionStatus
  product: { id: string, name: string, category: string }
  producer: { id: string, name: string }
  quantity: number
  unit: string
  basePrice: number
  increment: number
  currentPrice: number
  leader: { id: string, name: string } | null
  startsAt: string
  endsAt: string
  bids: AuctionBidDto[]
  viewerCount: number
  winner: { id: string, name: string } | null
}

export interface ProducerAuctionDto {
  id: string
  status: AuctionStatus
  product: { id: string, name: string, category: string, unit: string }
  quantity: number
  unit: string
  basePrice: number
  increment: number
  durationMinutes: number
  startsAt: string
  endsAt: string
  currentPrice: number
  bidCount: number
  leader: { id: string, name: string } | null
  createdAt: string
}

const iso = (date: Date): string => new Date(date).toISOString()

function toPerson(person: AuctionPersonEmbedded | null | undefined): { id: string, name: string } | null {
  return person ? { id: String(person.id), name: person.name } : null
}

function toListDto(auction: AuctionRow): AuctionListDto {
  return {
    id: String(auction._id),
    product: { id: String(auction.product), name: auction.productName, category: auction.category },
    currentPrice: auction.currentPrice,
    endsAt: iso(auction.endsAt),
    viewers: auction.status === 'ended' ? auction.lastViewers : viewerCount(String(auction._id)),
    status: auction.status as PublicAuctionStatus,
  }
}

function toBidDto(bid: BidRow): AuctionBidDto {
  return {
    id: String(bid._id),
    amount: bid.amount,
    name: bid.name,
    bidderId: String(bid.bidder),
    date: iso(bid.createdAt),
  }
}

function toRoomDto(
  auction: AuctionRow,
  producerName: string,
  bids: BidRow[],
): AuctionRoomDto {
  return {
    id: String(auction._id),
    status: auction.status as PublicAuctionStatus,
    product: { id: String(auction.product), name: auction.productName, category: auction.category },
    producer: { id: String(auction.producer), name: producerName },
    quantity: auction.quantity,
    unit: auction.unit,
    basePrice: auction.basePrice,
    increment: auction.increment,
    currentPrice: auction.currentPrice,
    leader: toPerson(auction.leader),
    startsAt: iso(auction.startsAt),
    endsAt: iso(auction.endsAt),
    bids: bids.map(toBidDto),
    viewerCount: viewerCount(String(auction._id)),
    winner: auction.status === 'ended' ? toPerson(auction.winner) : null,
  }
}

function toProducerAuctionDto(auction: AuctionRow): ProducerAuctionDto {
  return {
    id: String(auction._id),
    status: auction.status,
    product: {
      id: String(auction.product),
      name: auction.productName,
      category: auction.category,
      unit: auction.unit,
    },
    quantity: auction.quantity,
    unit: auction.unit,
    basePrice: auction.basePrice,
    increment: auction.increment,
    durationMinutes: auction.durationMinutes,
    startsAt: iso(auction.startsAt),
    endsAt: iso(auction.endsAt),
    currentPrice: auction.currentPrice,
    bidCount: auction.bidCount,
    leader: toPerson(auction.leader),
    createdAt: iso(auction.createdAt),
  }
}

// Public reads never expose drafts or cancelled auctions.
const PUBLIC_FILTER = { cancelled: { $ne: true }, status: { $in: ['scheduled', 'active', 'ended'] } }

export async function listPublicAuctions(query: ListAuctionsQuery): Promise<AuctionListDto[]> {
  const sort: Record<string, 1 | -1> = query.status === 'ended' ? { endsAt: -1, _id: -1 } : { endsAt: 1, _id: 1 }
  const auctions: AuctionRow[] = await AuctionModel.find({ ...PUBLIC_FILTER, status: query.status })
    .sort(sort)
    .limit(query.limit ?? 0)
    .lean()
  return auctions.map(toListDto)
}

export async function getPublicAuction(id: string): Promise<AuctionRoomDto> {
  const auction: AuctionRow | null = mongoose.isValidObjectId(id)
    ? await AuctionModel.findOne({ ...PUBLIC_FILTER, _id: id } as Record<string, unknown>).lean<AuctionRow>()
    : null
  if (!auction) throw new ApiError(404, 'AUCTION_NOT_FOUND', 'Auction not found')

  const [producer, bids] = await Promise.all([
    UserModel.findById(auction.producer).select('name').lean(),
    BidModel.find({ auction: auction._id }).sort({ createdAt: -1, _id: -1 }).limit(BIDS_LIMIT).lean(),
  ])
  return toRoomDto(auction, producer?.name ?? '', bids as BidRow[])
}

export async function listProducerAuctions(producerId: string): Promise<ProducerAuctionDto[]> {
  const auctions: AuctionRow[] = await AuctionModel.find({ producer: producerId })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
  return auctions.map(toProducerAuctionDto)
}

// The product must be the producer's own; a missing or foreign id has the same 403.
async function findOwnedProduct(producerId: string, productId: string) {
  const product = await ProductModel.findOne({ _id: productId, producer: producerId }).lean()
  if (!product) throw new ApiError(403, 'FORBIDDEN', 'Not your product')
  return product
}

function assertStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { quantity: 'Not enough stock' })
  }
}

function assertFuture(startsAt: Date): void {
  if (startsAt.getTime() <= Date.now()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { startsAt: 'Must be in the future' })
  }
}

// The server always derives endsAt itself; a body-provided value is stripped before this point.
function auctionFields(input: SaveAuctionInput, product: { _id: mongoose.Types.ObjectId, name: string, category: string, unit: string }) {
  const startsAt = new Date(input.startsAt)
  assertFuture(startsAt)
  const basePrice = round2(input.basePrice)
  return {
    product: product._id,
    productName: product.name,
    category: product.category,
    unit: product.unit,
    quantity: input.quantity,
    basePrice,
    increment: round2(input.increment),
    durationMinutes: input.durationMinutes,
    startsAt,
    endsAt: new Date(startsAt.getTime() + input.durationMinutes * 60_000),
    currentPrice: basePrice,
  }
}

export async function createAuction(producerId: string, input: SaveAuctionInput): Promise<ProducerAuctionDto> {
  const product = await findOwnedProduct(producerId, input.productId)
  assertStock(input.quantity, product.stock)
  const fields = auctionFields(input, product)
  const doc = await AuctionModel.create({
    ...fields,
    producer: producerId,
    status: DRAFT,
    cancelled: false,
    bidCount: 0,
    leader: null,
    winner: null,
    lastViewers: 0,
  })
  return toProducerAuctionDto(doc.toObject() as AuctionRow)
}

async function findOwnedAuction(producerId: string, id: string): Promise<AuctionRow> {
  const auction: AuctionRow | null = mongoose.isValidObjectId(id)
    ? await AuctionModel.findOne({ _id: id, producer: producerId }).lean()
    : null
  if (auction) return auction

  const exists = mongoose.isValidObjectId(id) ? await AuctionModel.exists({ _id: id }) : null
  if (exists) throw new ApiError(403, 'FORBIDDEN', 'Not your auction')
  throw new ApiError(404, 'NOT_FOUND', 'Auction not found')
}

// The state change itself is one conditional update, so a racing request cannot double-apply it.
async function draftUpdateFailed(producerId: string, id: string): Promise<never> {
  const existing = mongoose.isValidObjectId(id)
    ? await AuctionModel.findOne({ _id: id }).select('producer').lean()
    : null
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Auction not found')
  if (String(existing.producer) !== producerId) throw new ApiError(403, 'FORBIDDEN', 'Not your auction')
  throw new ApiError(409, 'AUCTION_NOT_DRAFT', 'Only a draft auction can be changed')
}

export async function updateAuction(producerId: string, id: string, input: SaveAuctionInput): Promise<ProducerAuctionDto> {
  const current = await findOwnedAuction(producerId, id)
  if (current.status !== DRAFT) throw new ApiError(409, 'AUCTION_NOT_DRAFT', 'Only a draft auction can be changed')

  const product = await findOwnedProduct(producerId, input.productId)
  assertStock(input.quantity, product.stock)
  const fields = auctionFields(input, product)

  const updated: AuctionRow | null = await AuctionModel.findOneAndUpdate(
    { _id: id, producer: producerId, status: DRAFT },
    { $set: { ...fields, bidCount: 0, leader: null } },
    { returnDocument: 'after', runValidators: true },
  ).lean()
  if (!updated) return draftUpdateFailed(producerId, id)
  return toProducerAuctionDto(updated)
}

export async function publishAuction(producerId: string, id: string): Promise<ProducerAuctionDto> {
  const current = await findOwnedAuction(producerId, id)
  if (current.status !== DRAFT) throw new ApiError(409, 'AUCTION_NOT_DRAFT', 'Only a draft auction can be published')

  const product = await ProductModel.findOne({ _id: current.product, producer: producerId }).select('stock').lean()
  if (!product) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { productId: 'Product no longer available' })
  }
  assertStock(current.quantity, product.stock)

  const now = Date.now()
  if (now >= current.endsAt.getTime()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { startsAt: 'Auction window has passed' })
  }
  const status: AuctionStatus = now >= current.startsAt.getTime() ? 'active' : 'scheduled'

  const updated: AuctionRow | null = await AuctionModel.findOneAndUpdate(
    { _id: id, producer: producerId, status: DRAFT },
    { $set: { status } },
    { returnDocument: 'after', runValidators: true },
  ).lean()
  if (!updated) return draftUpdateFailed(producerId, id)
  return toProducerAuctionDto(updated)
}

export async function cancelAuction(producerId: string, id: string): Promise<ProducerAuctionDto> {
  const updated: AuctionRow | null = mongoose.isValidObjectId(id)
    ? await AuctionModel.findOneAndUpdate(
        {
          _id: id,
          producer: producerId,
          status: { $in: ['draft', 'scheduled', 'active'] },
          bidCount: 0,
        },
        { $set: { status: 'ended', cancelled: true, leader: null } },
        { returnDocument: 'after', runValidators: true },
      ).lean()
    : null
  if (updated) return toProducerAuctionDto(updated)

  const existing = mongoose.isValidObjectId(id)
    ? await AuctionModel.findOne({ _id: id }).select('producer status bidCount').lean()
    : null
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Auction not found')
  if (String(existing.producer) !== producerId) throw new ApiError(403, 'FORBIDDEN', 'Not your auction')
  if (existing.status === 'ended') throw new ApiError(409, 'AUCTION_ALREADY_ENDED', 'Auction already ended')
  throw new ApiError(409, 'AUCTION_HAS_BIDS', 'Auction already has bids')
}

// Used by products.service before deleting a product (BE-06 stub replaced here).
export async function productHasLiveAuction(productId: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(productId)) return false
  return (await AuctionModel.exists({ product: productId, status: { $in: ['scheduled', 'active'] } })) !== null
}

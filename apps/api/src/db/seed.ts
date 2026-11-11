import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connect, disconnect } from './connect.js'
import { AuctionModel } from '../modules/auctions/auctions.model.js'
import { BidModel } from '../modules/auctions/bids.model.js'
import { OrderModel } from '../modules/orders/orders.model.js'
import { ProductModel } from '../modules/products/products.model.js'
import { ReviewModel } from '../modules/reviews/reviews.model.js'
import { recomputeRatings } from '../modules/reviews/reviews.service.js'
import { UserModel } from '../modules/users/users.model.js'
import { SEED_BUYERS, SEED_PRODUCERS, SEED_PRODUCTS } from './seed-data.js'

const BCRYPT_COST = 12

// $set applies on insert too, so display fields converge on every run while
// $setOnInsert only fills in new documents: passwords, roles, statuses and
// cards are never overwritten and nothing is ever deleted.
interface SeedUser {
  email: string
  password: string
  set: Record<string, unknown>
  setOnInsert: Record<string, unknown>
}

function producerSeed(email: string, password: string) {
  const spec = SEED_PRODUCERS.find((p) => p.email === email)
  if (!spec) throw new Error(`No seed data for ${email}`)
  const set: Record<string, unknown> = {
    name: spec.name,
    address: '',
    'producer.bio': spec.bio,
    'producer.location': spec.location,
    'producer.photoUrl': '',
  }
  if (spec.lat !== undefined) set['producer.lat'] = spec.lat
  if (spec.lng !== undefined) set['producer.lng'] = spec.lng
  const setOnInsert: Record<string, unknown> = {
    email,
    role: 'producer',
    cart: [],
    card: null,
    'producer.farmName': spec.farmName,
    'producer.status': spec.status,
    'producer.hidden': false,
    'producer.rejectReason': '',
  }
  return { email, password, set, setOnInsert }
}

async function seedUsers(): Promise<void> {
  const seeds: SeedUser[] = [
    {
      email: 'admin@farmtotable.test',
      password: env.seed.adminPassword,
      set: { name: 'Site Admin' },
      setOnInsert: { email: 'admin@farmtotable.test', role: 'admin', address: '', cart: [], card: null },
    },
    ...SEED_BUYERS.map((buyer) => ({
      email: buyer.email,
      password: env.seed.userPassword,
      set: { name: buyer.name, address: buyer.address } as Record<string, unknown>,
      setOnInsert: {
        email: buyer.email,
        role: 'buyer',
        cart: [],
        // A valid demo card so auction settlement can charge the winner.
        card: { last4: '1111', holder: buyer.name, expiry: '12/30', simulateInvalid: false },
      } as Record<string, unknown>,
    })),
    ...SEED_PRODUCERS.map((spec) => producerSeed(spec.email, env.seed.userPassword)),
  ]

  for (const seed of seeds) {
    const passwordHash = await bcrypt.hash(seed.password, BCRYPT_COST)
    const result = await UserModel.updateOne(
      { email: seed.email },
      { $set: seed.set, $setOnInsert: { ...seed.setOnInsert, passwordHash } },
      { upsert: true },
    )
    const state = (result.upsertedCount ?? 0) > 0 ? 'created' : 'already existed'
    console.log(`${seed.email}: ${state}`)
  }
}

async function seedProducts(): Promise<void> {
  const emails = [...new Set(SEED_PRODUCTS.map((p) => p.producerEmail))]
  const users = await UserModel.find({ email: { $in: emails } }).select('_id email').lean()
  const byEmail = new Map(users.map((u) => [u.email, u._id]))
  let created = 0
  for (const product of SEED_PRODUCTS) {
    const producer = byEmail.get(product.producerEmail)
    if (!producer) throw new Error(`Seed producer missing: ${product.producerEmail}`)
    const result = await ProductModel.updateOne(
      { producer, name: product.name },
      {
        $setOnInsert: {
          producer,
          name: product.name,
          description: product.description,
          ingredients: product.ingredients,
          category: product.category,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
          season: product.season,
          organic: product.organic,
          hidden: false,
          averageRating: 0,
          ratingCount: 0,
        },
      },
      { upsert: true },
    )
    if ((result.upsertedCount ?? 0) > 0) created += 1
  }
  console.log(`products: ${SEED_PRODUCTS.length} checked, ${created} created`)
}

async function tryReserve(productId: unknown, quantity: number): Promise<void> {
  await ProductModel.updateOne({ _id: productId, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })
}

async function seedOrdersAndReviews(): Promise<void> {
  const [buyer1, buyer2] = await Promise.all(
    SEED_BUYERS.map((b) => UserModel.findOne({ email: b.email }).select('_id name').lean()),
  )
  if (!buyer1 || !buyer2) throw new Error('Seed buyers missing')
  const products = await ProductModel.find({ name: { $in: ['Heirloom tomatoes', 'Courgette', 'Heather honey', 'Chestnut honey', 'Cured cheese'] } })
    .select('_id name price unit producer stock')
    .lean()
  const byName = new Map(products.map((p) => [p.name, p]))
  const get = (name: string) => {
    const product = byName.get(name)
    if (!product) throw new Error(`Seed product missing: ${name}`)
    return product
  }

  // A few delivered orders with reviews; skipped when the demo already has them.
  const delivered = await OrderModel.countDocuments({ buyer: { $in: [buyer1._id, buyer2._id] }, status: 'delivered' })
  if (delivered < 3) {
    const day = 24 * 60 * 60 * 1000
    const now = Date.now()
    const historyFor = (daysAgo: number) =>
      (['pending', 'confirmed', 'ready', 'delivered'] as const).map((status, index) => ({
        status,
        date: new Date(now - daysAgo * day + index * 36 * 60 * 1000),
      }))
    const specs = [
      {
        buyer: buyer1._id,
        producer: get('Heirloom tomatoes').producer,
        items: [
          { productId: get('Heirloom tomatoes')._id, name: 'Heirloom tomatoes', price: 3.2, quantity: 2, unit: 'kg' },
          { productId: get('Courgette')._id, name: 'Courgette', price: 2.2, quantity: 1, unit: 'kg' },
        ],
        total: 8.6,
        fulfilment: 'pickup' as const,
        address: null,
        daysAgo: 12,
      },
      {
        buyer: buyer1._id,
        producer: get('Heather honey').producer,
        items: [
          { productId: get('Heather honey')._id, name: 'Heather honey', price: 8.5, quantity: 1, unit: 'jar' },
          { productId: get('Chestnut honey')._id, name: 'Chestnut honey', price: 7.8, quantity: 2, unit: 'jar' },
        ],
        total: 24.1,
        fulfilment: 'delivery' as const,
        address: { line1: 'Rua das Flores 12', city: 'Lisboa', postalCode: '1200-195' },
        daysAgo: 9,
      },
      {
        buyer: buyer2._id,
        producer: get('Cured cheese').producer,
        items: [
          { productId: get('Cured cheese')._id, name: 'Cured cheese', price: 12.0, quantity: 1, unit: 'wheel' },
        ],
        total: 12.0,
        fulfilment: 'pickup' as const,
        address: null,
        daysAgo: 6,
      },
    ]
    for (const spec of specs) {
      const exists = await OrderModel.exists({ buyer: spec.buyer, producer: spec.producer, status: 'delivered', total: spec.total })
      if (exists) continue
      for (const item of spec.items) await tryReserve(item.productId, item.quantity)
      await OrderModel.create({
        buyer: spec.buyer,
        producer: spec.producer,
        items: spec.items,
        total: spec.total,
        status: 'delivered',
        history: historyFor(spec.daysAgo),
        fulfilment: spec.fulfilment,
        address: spec.address,
      })
    }
    console.log('orders: 3 delivered demo orders ensured')
  } else {
    console.log(`orders: ${delivered} delivered demo orders already exist`)
  }

  // One review per delivered demo order; skipped when reviews already exist.
  if ((await ReviewModel.countDocuments({})) < 3) {
    const orders = await OrderModel.find({ buyer: { $in: [buyer1._id, buyer2._id] }, status: 'delivered' })
      .sort({ createdAt: 1 })
      .limit(3)
      .lean()
    const ratings = [
      { rating: 5, text: 'Crisp vegetables, generous bunches, and everything tasted picked that morning.' },
      { rating: 4, text: 'Lovely honey, though the delivery arrived a day later than promised.' },
      { rating: 5, text: 'The cured wheel was perfect and the pickup took two minutes.' },
    ]
    const touched = new Set<string>()
    for (let i = 0; i < orders.length; i += 1) {
      const order = orders[i]!
      if (await ReviewModel.exists({ order: order._id })) continue
      const productIds = [...new Set(order.items.map((item) => String(item.productId)))]
      await ReviewModel.create({
        order: order._id,
        buyer: order.buyer,
        producer: order.producer,
        products: productIds.map((id) => new mongoose.Types.ObjectId(id)),
        productName: order.items.length === 1 ? order.items[0]!.name : null,
        rating: ratings[i % ratings.length]!.rating,
        text: ratings[i % ratings.length]!.text,
      })
      touched.add(String(order.producer))
      for (const id of productIds) touched.add(`product:${id}`)
    }
    for (const key of touched) {
      if (key.startsWith('product:')) continue
      const productIds = (await ProductModel.find({ producer: key }).select('_id').lean()).map((p) => String(p._id))
      await recomputeRatings(key, productIds)
    }
    console.log('reviews: demo reviews ensured')
  } else {
    console.log('reviews: demo reviews already exist')
  }

  // Exactly one open report for the admin moderation queue.
  if (!(await ReviewModel.exists({ 'report.open': true }))) {
    const honeyProducer = await UserModel.findOne({ email: 'apiario-serra@farmtotable.test' }).select('_id').lean()
    const reported = honeyProducer
      ? await ReviewModel.findOne({ producer: honeyProducer._id }).sort({ createdAt: -1 }).lean()
      : null
    if (reported) {
      await ReviewModel.updateOne(
        { _id: reported._id },
        { $set: { report: { reason: 'Producer disputes the delivery delay claim', reportedAt: new Date(), open: true } } },
      )
      console.log('reviews: one demo report opened')
    }
  }
}

async function seedAuctions(): Promise<void> {
  const vale = await UserModel.findOne({ email: 'approved-producer@farmtotable.test' }).select('_id name').lean()
  const apiario = await UserModel.findOne({ email: 'apiario-serra@farmtotable.test' }).select('_id name').lean()
  const [buyer1, buyer2] = await Promise.all(
    SEED_BUYERS.map((b) => UserModel.findOne({ email: b.email }).select('_id name').lean()),
  )
  if (!vale || !apiario || !buyer1 || !buyer2) throw new Error('Seed users missing for auctions')
  const walnuts = await ProductModel.findOne({ producer: vale._id, name: 'Walnuts' }).lean()
  const honey = await ProductModel.findOne({ producer: apiario._id, name: 'Wildflower honey' }).lean()
  if (!walnuts || !honey) throw new Error('Seed products missing for auctions')

  if (!(await AuctionModel.exists({ status: 'scheduled' }))) {
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
    await AuctionModel.create({
      producer: vale._id,
      product: walnuts._id,
      productName: walnuts.name,
      category: walnuts.category,
      unit: walnuts.unit,
      quantity: 5,
      basePrice: 45,
      increment: 5,
      durationMinutes: 60,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
      status: 'scheduled',
      cancelled: false,
      currentPrice: 45,
      bidCount: 0,
      leader: null,
      winner: null,
      lastViewers: 0,
    })
    console.log('auctions: scheduled demo auction created')
  } else {
    console.log('auctions: scheduled demo auction already exists')
  }

  if (!(await AuctionModel.exists({ status: 'active' }))) {
    const startsAt = new Date(Date.now() - 10 * 60 * 1000)
    const auction = await AuctionModel.create({
      producer: apiario._id,
      product: honey._id,
      productName: honey.name,
      category: honey.category,
      unit: honey.unit,
      quantity: 4,
      basePrice: 30,
      increment: 5,
      durationMinutes: 15,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 15 * 60 * 1000),
      status: 'active',
      cancelled: false,
      currentPrice: 45,
      bidCount: 3,
      leader: { id: buyer1._id, name: buyer1.name },
      winner: null,
      lastViewers: 0,
    })
    await BidModel.insertMany([
      { auction: auction._id, bidder: buyer1._id, name: buyer1.name, amount: 35 },
      { auction: auction._id, bidder: buyer2._id, name: buyer2.name, amount: 40 },
      { auction: auction._id, bidder: buyer1._id, name: buyer1.name, amount: 45 },
    ])
    console.log('auctions: active demo auction with 3 bids created')
  } else {
    console.log('auctions: active demo auction already exists')
  }
}

async function main(): Promise<void> {
  const missing: string[] = []
  if (!env.seed.adminPassword) missing.push('SEED_ADMIN_PASSWORD')
  if (!env.seed.userPassword) missing.push('SEED_USER_PASSWORD')
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
    process.exit(1)
  }

  await connect()
  try {
    await seedUsers()
    await seedProducts()
    await seedOrdersAndReviews()
    await seedAuctions()
  } finally {
    await disconnect()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})

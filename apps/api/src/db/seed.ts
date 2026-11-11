import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { connect, disconnect } from './connect.js'
import { UserModel, type UserDoc } from '../modules/users/users.model.js'

const BCRYPT_COST = 12

interface SeedUser {
  email: string
  doc: Omit<UserDoc, 'cart'> & Partial<Pick<UserDoc, 'cart'>>
  password: string
}

async function main(): Promise<void> {
  const missing: string[] = []
  if (!env.seed.adminPassword) missing.push('SEED_ADMIN_PASSWORD')
  if (!env.seed.userPassword) missing.push('SEED_USER_PASSWORD')
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
    process.exit(1)
  }

  const seeds: SeedUser[] = [
    {
      email: 'admin@farmtotable.test',
      password: env.seed.adminPassword,
      doc: {
        name: 'Site Admin',
        email: 'admin@farmtotable.test',
        passwordHash: '',
        role: 'admin',
        address: '',
        card: null,
      },
    },
    {
      email: 'buyer@farmtotable.test',
      password: env.seed.userPassword,
      doc: {
        name: 'Maria Silva',
        email: 'buyer@farmtotable.test',
        passwordHash: '',
        role: 'buyer',
        address: 'Rua das Flores 12, Lisboa',
        card: null,
      },
    },
    {
      email: 'approved-producer@farmtotable.test',
      password: env.seed.userPassword,
      doc: {
        name: 'Joao Pereira',
        email: 'approved-producer@farmtotable.test',
        passwordHash: '',
        role: 'producer',
        address: '',
        card: null,
        producer: {
          farmName: 'Quinta do Vale Verde',
          status: 'approved',
          bio: 'Family farm growing seasonal vegetables and fruit.',
          location: 'Obidos',
          photoUrl: '',
          hidden: false,
          rejectReason: '',
        },
      },
    },
    {
      email: 'pending-producer@farmtotable.test',
      password: env.seed.userPassword,
      doc: {
        name: 'Ana Costa',
        email: 'pending-producer@farmtotable.test',
        passwordHash: '',
        role: 'producer',
        address: '',
        card: null,
        producer: {
          farmName: 'Horta da Ribeira',
          status: 'pending',
          bio: 'Small market garden by the river.',
          location: 'Torres Vedras',
          photoUrl: '',
          hidden: false,
          rejectReason: '',
        },
      },
    },
  ]

  await connect()
  try {
    for (const seed of seeds) {
      const passwordHash = await bcrypt.hash(seed.password, BCRYPT_COST)
      const result = await UserModel.updateOne(
        { email: seed.email },
        { $setOnInsert: { ...seed.doc, passwordHash } },
        { upsert: true },
      )
      const state = (result.upsertedCount ?? 0) > 0 ? 'created' : 'already existed'
      console.log(`${seed.email} (${seed.doc.role}): ${state}`)
    }
  } finally {
    await disconnect()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})

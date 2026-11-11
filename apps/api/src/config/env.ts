// All environment variables are read here and nowhere else.
const DEV_JWT_DEFAULT = 'dev-only-change-me'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const rawJwtSecret = process.env.JWT_SECRET
const jwtSecret = rawJwtSecret ?? DEV_JWT_DEFAULT

if (nodeEnv === 'production' && (!rawJwtSecret || jwtSecret === DEV_JWT_DEFAULT)) {
  throw new Error('JWT_SECRET must be set to a real secret in production')
}

// Point tests at farm_to_table_test on the same host, never the dev database.
function testMongoUrl(raw: string | undefined): string {
  const fallback = 'mongodb://localhost:27017/farm_to_table_test'
  if (!raw) return fallback
  try {
    const url = new URL(raw)
    url.pathname = '/farm_to_table_test'
    return url.toString()
  } catch {
    return fallback
  }
}

const rawMongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017/farm_to_table'

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv,
  mongoUrl: nodeEnv === 'test' ? testMongoUrl(process.env.MONGO_URL) : rawMongoUrl,
  jwtSecret,
  seed: {
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? '',
    userPassword: process.env.SEED_USER_PASSWORD ?? '',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    bucket: process.env.S3_BUCKET ?? 'farm-to-table',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
  },
}

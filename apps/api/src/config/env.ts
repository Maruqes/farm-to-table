// All environment variables are read here and nowhere else.
export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://localhost:27017/farm_to_table',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
}

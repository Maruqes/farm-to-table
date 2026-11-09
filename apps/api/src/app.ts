import express from 'express'

// Express app only (no listen) so tests can import it. Routers are mounted from src/modules/*.
export const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

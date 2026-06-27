require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initSchema } = require('./db/database')

const app = express()

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://maktabaah.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({ origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)) }))
app.use(express.json())

app.use('/api/auth',       require('./routes/auth'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/products',   require('./routes/products'))
app.use('/api/cities',     require('./routes/cities'))
app.use('/api/schools',    require('./routes/schools'))
app.use('/api/lists',      require('./routes/lists'))
app.use('/api/sales',      require('./routes/sales'))
app.use('/api/loyalty',    require('./routes/loyalty'))
app.use('/api/admin',      require('./routes/admin'))

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur' })
})

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await initSchema()
    console.log('Database schema initialized')
  } catch (err) {
    console.error('Database init failed (will retry on first request):', err.message)
  }
  app.listen(PORT, () => console.log(`Maktabah backend running on http://localhost:${PORT}`))
}

startServer()

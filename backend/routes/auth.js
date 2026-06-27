const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function makeToken(store) {
  return jwt.sign({ id: store.id, role: store.role, plan: store.plan }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function sanitize(store) {
  const { password, ...rest } = store
  return rest
}

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) return res.status(400).json({ error: 'Champs manquants' })

    let result = await query('SELECT * FROM stores WHERE email = $1 AND role = $2', [identifier, 'admin'])
    let store = result.rows[0]
    if (!store) {
      result = await query('SELECT * FROM stores WHERE phone = $1 AND role != $2', [identifier, 'admin'])
      store = result.rows[0]
    }
    if (!store) return res.status(401).json({ error: 'invalidCredentials' })
    if (!bcrypt.compareSync(password, store.password)) return res.status(401).json({ error: 'invalidCredentials' })
    if (!store.active && store.role !== 'admin') return res.status(403).json({ error: 'accountInactive' })

    res.json({ token: makeToken(store), user: sanitize(store) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'serverError' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { storeName, phone, password, plan } = req.body
    if (!storeName || !phone || !password || !plan) return res.status(400).json({ error: 'Champs manquants' })
    if (password.length < 6) return res.status(400).json({ error: 'passwordTooShort' })
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'phoneInvalid' })
    if (!['gratuit', 'standard', 'premium'].includes(plan)) return res.status(400).json({ error: 'Plan invalide' })

    const existsResult = await query('SELECT id FROM stores WHERE phone = $1', [phone])
    if (existsResult.rows[0]) return res.status(409).json({ error: 'phoneExists' })

    const isGratuit = plan === 'gratuit'
    const id = uid()
    const hash = bcrypt.hashSync(password, 10)
    const now = fmtDate(new Date())

    await query(
      `INSERT INTO stores (id, "storeName", phone, email, password, plan, paid, active, pending, role, "startDate", "endDate", "registeredAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, storeName, phone, '', hash, plan, false, isGratuit, !isGratuit, 'store', '', '', now]
    )

    const storeResult = await query('SELECT * FROM stores WHERE id = $1', [id])
    const store = storeResult.rows[0]
    if (isGratuit) return res.status(201).json({ token: makeToken(store), user: sanitize(store) })
    res.status(201).json({ message: 'pending' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'serverError' })
  }
})

router.patch('/plan-request', auth, async (req, res) => {
  try {
    const { plan } = req.body
    if (!plan || !['standard', 'premium'].includes(plan)) return res.status(400).json({ error: 'Plan invalide' })
    await query('UPDATE stores SET "pendingPlan" = $1 WHERE id = $2', [plan, req.user.id])
    res.json({ ok: true, pendingPlan: plan })
  } catch (err) {
    console.error('Plan request error:', err)
    res.status(500).json({ error: 'serverError' })
  }
})

module.exports = router

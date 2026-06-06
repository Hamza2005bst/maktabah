const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function makeToken(store) {
  return jwt.sign({ id: store.id, role: store.role, plan: store.plan }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function sanitize(store) {
  const { password, ...rest } = store
  return { ...rest, paid: !!rest.paid, active: !!rest.active, pending: !!rest.pending }
}

router.post('/login', (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password) return res.status(400).json({ error: 'Champs manquants' })

  let store = db.prepare('SELECT * FROM stores WHERE email = ? AND role = ?').get(identifier, 'admin')
  if (!store) store = db.prepare('SELECT * FROM stores WHERE phone = ? AND role != ?').get(identifier, 'admin')
  if (!store) return res.status(401).json({ error: 'invalidCredentials' })
  if (!bcrypt.compareSync(password, store.password)) return res.status(401).json({ error: 'invalidCredentials' })
  if (!store.active && store.role !== 'admin') return res.status(403).json({ error: 'accountInactive' })

  res.json({ token: makeToken(store), user: sanitize(store) })
})

router.post('/register', (req, res) => {
  const { storeName, phone, password, plan } = req.body
  if (!storeName || !phone || !password || !plan) return res.status(400).json({ error: 'Champs manquants' })
  if (password.length < 6) return res.status(400).json({ error: 'passwordTooShort' })
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'phoneInvalid' })
  if (!['gratuit', 'standard', 'premium'].includes(plan)) return res.status(400).json({ error: 'Plan invalide' })

  const exists = db.prepare('SELECT id FROM stores WHERE phone = ?').get(phone)
  if (exists) return res.status(409).json({ error: 'phoneExists' })

  const isGratuit = plan === 'gratuit'
  const id = uid()
  const hash = bcrypt.hashSync(password, 10)
  const now = fmtDate(new Date())

  db.prepare(`INSERT INTO stores (id,storeName,phone,email,password,plan,paid,active,pending,role,startDate,endDate,registeredAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, storeName, phone, '', hash, plan, 0, isGratuit ? 1 : 0, isGratuit ? 0 : 1, 'store', '', '', now)

  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id)
  if (isGratuit) return res.status(201).json({ token: makeToken(store), user: sanitize(store) })
  res.status(201).json({ message: 'pending' })
})

router.patch('/plan-request', auth, (req, res) => {
  const { plan } = req.body
  if (!plan || !['standard', 'premium'].includes(plan)) return res.status(400).json({ error: 'Plan invalide' })
  db.prepare('UPDATE stores SET pendingPlan = ? WHERE id = ?').run(plan, req.user.id)
  res.json({ ok: true, pendingPlan: plan })
})

module.exports = router

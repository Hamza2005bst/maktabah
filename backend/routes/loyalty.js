const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 1, standard: 5, premium: Infinity }
router.use(auth)

router.get('/settings', (req, res) => {
  const setting = db.prepare('SELECT * FROM loyalty_settings WHERE storeId = ?').get(req.user.id)
  res.json(setting || { storeId: req.user.id, pointsPerDh: 1, pointsForDh: 25 })
})

router.put('/settings', (req, res) => {
  const { pointsPerDh, pointsForDh } = req.body
  const existing = db.prepare('SELECT id FROM loyalty_settings WHERE storeId = ?').get(req.user.id)
  if (existing) {
    db.prepare('UPDATE loyalty_settings SET pointsPerDh=?,pointsForDh=? WHERE storeId=?').run(pointsPerDh, pointsForDh, req.user.id)
  } else {
    db.prepare('INSERT INTO loyalty_settings VALUES (?,?,?,?)').run(uid(), req.user.id, pointsPerDh, pointsForDh)
  }
  res.json({ storeId: req.user.id, pointsPerDh, pointsForDh })
})

router.get('/cards', (req, res) => res.json(db.prepare('SELECT * FROM loyalty_cards WHERE storeId = ?').all(req.user.id)))

router.post('/cards', (req, res) => {
  const { name, phone, id: providedId } = req.body
  if (!name) return res.status(400).json({ error: 'Nom requis' })
  const limit = LIMITS[req.user.plan] ?? Infinity
  const count = db.prepare('SELECT COUNT(*) as n FROM loyalty_cards WHERE storeId = ?').get(req.user.id).n
  if (count >= limit) return res.status(403).json({ error: 'planLimit' })
  const id = providedId || uid()
  db.prepare('INSERT INTO loyalty_cards VALUES (?,?,?,?,?)').run(id, req.user.id, name, phone || '', 0)
  res.status(201).json({ id, storeId: req.user.id, name, phone: phone || '', points: 0 })
})

router.put('/cards/:id', (req, res) => {
  const card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!card) return res.status(404).json({ error: 'Carte introuvable' })
  const newName = req.body.name ?? card.name
  const newPhone = req.body.phone ?? card.phone
  db.prepare('UPDATE loyalty_cards SET name=?,phone=? WHERE id=?').run(newName, newPhone, req.params.id)
  res.json({ ...card, name: newName, phone: newPhone })
})

router.patch('/cards/:id/points', (req, res) => {
  const card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!card) return res.status(404).json({ error: 'Carte introuvable' })
  const newPoints = Math.max(0, card.points + (req.body.delta || 0))
  db.prepare('UPDATE loyalty_cards SET points = ? WHERE id = ?').run(newPoints, req.params.id)
  res.json({ ...card, points: newPoints })
})

router.delete('/cards/:id', (req, res) => {
  const card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!card) return res.status(404).json({ error: 'Carte introuvable' })
  db.prepare('DELETE FROM loyalty_cards WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

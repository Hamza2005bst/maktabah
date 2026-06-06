const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 2, standard: 5, premium: Infinity }
router.use(auth)

router.get('/', (req, res) => res.json(db.prepare('SELECT * FROM schools WHERE storeId = ?').all(req.user.id)))

router.post('/', (req, res) => {
  const { name, cityId } = req.body
  if (!name || !cityId) return res.status(400).json({ error: 'Champs manquants' })
  const limit = LIMITS[req.user.plan] ?? Infinity
  const count = db.prepare('SELECT COUNT(*) as n FROM schools WHERE storeId = ?').get(req.user.id).n
  if (count >= limit) return res.status(403).json({ error: 'planLimit' })
  const id = uid()
  db.prepare('INSERT INTO schools VALUES (?,?,?,?)').run(id, name, cityId, req.user.id)
  res.status(201).json({ id, name, cityId, storeId: req.user.id })
})

router.delete('/:id', (req, res) => {
  const school = db.prepare('SELECT * FROM schools WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!school) return res.status(404).json({ error: 'École introuvable' })
  const listIds = db.prepare('SELECT id FROM lists WHERE schoolId = ?').all(req.params.id).map(l => l.id)
  if (listIds.length) {
    db.prepare(`DELETE FROM list_items WHERE listId IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
    db.prepare(`DELETE FROM lists WHERE id IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
  }
  db.prepare('DELETE FROM schools WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

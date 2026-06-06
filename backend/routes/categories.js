const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 3, standard: Infinity, premium: Infinity }

router.use(auth)

router.get('/', (req, res) => res.json(db.prepare('SELECT * FROM categories WHERE storeId = ?').all(req.user.id)))

router.post('/', (req, res) => {
  const { name, colorIndex } = req.body
  if (!name) return res.status(400).json({ error: 'Nom requis' })
  const limit = LIMITS[req.user.plan] ?? Infinity
  const count = db.prepare('SELECT COUNT(*) as n FROM categories WHERE storeId = ?').get(req.user.id).n
  if (count >= limit) return res.status(403).json({ error: 'planLimit' })
  const id = uid()
  db.prepare('INSERT INTO categories VALUES (?,?,?,?)').run(id, name, colorIndex ?? 0, req.user.id)
  res.status(201).json({ id, name, colorIndex: colorIndex ?? 0, storeId: req.user.id })
})

router.put('/:id', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Nom requis' })
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' })
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, req.params.id)
  res.json({ ...cat, name })
})

router.delete('/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' })
  db.prepare('DELETE FROM products WHERE categoryId = ?').run(req.params.id)
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

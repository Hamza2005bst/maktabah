const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
router.use(auth)

router.get('/', (req, res) => res.json(db.prepare('SELECT * FROM cities WHERE storeId = ?').all(req.user.id)))

router.post('/', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Nom requis' })
  const id = uid()
  db.prepare('INSERT INTO cities VALUES (?,?,?)').run(id, name, req.user.id)
  res.status(201).json({ id, name, storeId: req.user.id })
})

router.delete('/:id', (req, res) => {
  const city = db.prepare('SELECT * FROM cities WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!city) return res.status(404).json({ error: 'Ville introuvable' })
  const schoolIds = db.prepare('SELECT id FROM schools WHERE cityId = ?').all(req.params.id).map(s => s.id)
  if (schoolIds.length) {
    const listIds = db.prepare(`SELECT id FROM lists WHERE schoolId IN (${schoolIds.map(() => '?').join(',')})`).all(...schoolIds).map(l => l.id)
    if (listIds.length) {
      db.prepare(`DELETE FROM list_items WHERE listId IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
      db.prepare(`DELETE FROM lists WHERE id IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
    }
    db.prepare(`DELETE FROM schools WHERE id IN (${schoolIds.map(() => '?').join(',')})`).run(...schoolIds)
  }
  db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

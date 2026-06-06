const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 1, standard: 20, premium: Infinity }
router.use(auth)

router.get('/', (req, res) => {
  const lists = db.prepare('SELECT * FROM lists WHERE storeId = ?').all(req.user.id)
  const listIds = lists.map(l => l.id)
  let items = []
  if (listIds.length) items = db.prepare(`SELECT * FROM list_items WHERE listId IN (${listIds.map(() => '?').join(',')})`).all(...listIds)
  res.json({ lists, listItems: items })
})

router.post('/', (req, res) => {
  const { name, schoolId, items } = req.body
  if (!name || !schoolId) return res.status(400).json({ error: 'Champs manquants' })
  const limit = LIMITS[req.user.plan] ?? Infinity
  const count = db.prepare('SELECT COUNT(*) as n FROM lists WHERE storeId = ?').get(req.user.id).n
  if (count >= limit) return res.status(403).json({ error: 'planLimit' })
  const listId = uid()
  db.prepare('INSERT INTO lists VALUES (?,?,?,?)').run(listId, name, schoolId, req.user.id)
  const insItem = db.prepare('INSERT INTO list_items VALUES (?,?,?,?)')
  const createdItems = (items || []).map(item => {
    const id = uid()
    insItem.run(id, listId, item.productId, item.quantity)
    return { id, listId, productId: item.productId, quantity: item.quantity }
  })
  res.status(201).json({ id: listId, name, schoolId, storeId: req.user.id, items: createdItems })
})

router.put('/:id', (req, res) => {
  const list = db.prepare('SELECT * FROM lists WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!list) return res.status(404).json({ error: 'Liste introuvable' })
  const { name, schoolId, items } = req.body
  db.prepare('UPDATE lists SET name=?,schoolId=? WHERE id=?').run(name ?? list.name, schoolId ?? list.schoolId, req.params.id)
  db.prepare('DELETE FROM list_items WHERE listId = ?').run(req.params.id)
  const insItem = db.prepare('INSERT INTO list_items VALUES (?,?,?,?)')
  const createdItems = (items || []).map(item => {
    const id = uid()
    insItem.run(id, req.params.id, item.productId, item.quantity)
    return { id, listId: req.params.id, productId: item.productId, quantity: item.quantity }
  })
  res.json({ ...list, name: name ?? list.name, schoolId: schoolId ?? list.schoolId, items: createdItems })
})

router.delete('/:id', (req, res) => {
  const list = db.prepare('SELECT * FROM lists WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!list) return res.status(404).json({ error: 'Liste introuvable' })
  db.prepare('DELETE FROM list_items WHERE listId = ?').run(req.params.id)
  db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

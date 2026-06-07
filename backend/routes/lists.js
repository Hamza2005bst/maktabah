const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 1, standard: 20, premium: Infinity }
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const listsResult = await query('SELECT * FROM lists WHERE "storeId" = $1', [req.user.id])
    const lists = listsResult.rows
    const listIds = lists.map(l => l.id)
    let items = []
    if (listIds.length) {
      const itemsResult = await query('SELECT * FROM list_items WHERE "listId" = ANY($1)', [listIds])
      items = itemsResult.rows
    }
    res.json({ lists, listItems: items })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, schoolId, items } = req.body
    if (!name || !schoolId) return res.status(400).json({ error: 'Champs manquants' })
    const limit = LIMITS[req.user.plan] ?? Infinity
    const countResult = await query('SELECT COUNT(*) as n FROM lists WHERE "storeId" = $1', [req.user.id])
    if (parseInt(countResult.rows[0].n) >= limit) return res.status(403).json({ error: 'planLimit' })
    const listId = uid()
    await query('INSERT INTO lists (id, name, "schoolId", "storeId") VALUES ($1, $2, $3, $4)', [listId, name, schoolId, req.user.id])
    const createdItems = []
    for (const item of (items || [])) {
      const id = uid()
      await query('INSERT INTO list_items (id, "listId", "productId", quantity) VALUES ($1, $2, $3, $4)', [id, listId, item.productId, item.quantity])
      createdItems.push({ id, listId, productId: item.productId, quantity: item.quantity })
    }
    res.status(201).json({ id: listId, name, schoolId, storeId: req.user.id, items: createdItems })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const listResult = await query('SELECT * FROM lists WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const list = listResult.rows[0]
    if (!list) return res.status(404).json({ error: 'Liste introuvable' })
    const { name, schoolId, items } = req.body
    await query('UPDATE lists SET name=$1, "schoolId"=$2 WHERE id=$3', [name ?? list.name, schoolId ?? list.schoolId, req.params.id])
    await query('DELETE FROM list_items WHERE "listId" = $1', [req.params.id])
    const createdItems = []
    for (const item of (items || [])) {
      const id = uid()
      await query('INSERT INTO list_items (id, "listId", "productId", quantity) VALUES ($1, $2, $3, $4)', [id, req.params.id, item.productId, item.quantity])
      createdItems.push({ id, listId: req.params.id, productId: item.productId, quantity: item.quantity })
    }
    res.json({ ...list, name: name ?? list.name, schoolId: schoolId ?? list.schoolId, items: createdItems })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const listResult = await query('SELECT * FROM lists WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!listResult.rows[0]) return res.status(404).json({ error: 'Liste introuvable' })
    await query('DELETE FROM list_items WHERE "listId" = $1', [req.params.id])
    await query('DELETE FROM lists WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 3, standard: Infinity, premium: Infinity }

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, colorIndex } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    const limit = LIMITS[req.user.plan] ?? Infinity
    const countResult = await query('SELECT COUNT(*) as n FROM categories WHERE "storeId" = $1', [req.user.id])
    if (parseInt(countResult.rows[0].n) >= limit) return res.status(403).json({ error: 'planLimit' })
    const id = uid()
    await query(
      'INSERT INTO categories (id, name, "colorIndex", "storeId") VALUES ($1, $2, $3, $4)',
      [id, name, colorIndex ?? 0, req.user.id]
    )
    res.status(201).json({ id, name, colorIndex: colorIndex ?? 0, storeId: req.user.id })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    const catResult = await query('SELECT * FROM categories WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const cat = catResult.rows[0]
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' })
    await query('UPDATE categories SET name = $1 WHERE id = $2', [name, req.params.id])
    res.json({ ...cat, name })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const catResult = await query('SELECT * FROM categories WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!catResult.rows[0]) return res.status(404).json({ error: 'Catégorie introuvable' })
    await query('DELETE FROM products WHERE "categoryId" = $1', [req.params.id])
    await query('DELETE FROM categories WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

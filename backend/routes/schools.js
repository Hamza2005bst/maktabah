const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 2, standard: 5, premium: Infinity }
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM schools WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, cityId } = req.body
    if (!name || !cityId) return res.status(400).json({ error: 'Champs manquants' })
    const limit = LIMITS[req.user.plan] ?? Infinity
    const countResult = await query('SELECT COUNT(*) as n FROM schools WHERE "storeId" = $1', [req.user.id])
    if (parseInt(countResult.rows[0].n) >= limit) return res.status(403).json({ error: 'planLimit' })
    const id = uid()
    await query('INSERT INTO schools (id, name, "cityId", "storeId") VALUES ($1, $2, $3, $4)', [id, name, cityId, req.user.id])
    res.status(201).json({ id, name, cityId, storeId: req.user.id })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const schoolResult = await query('SELECT * FROM schools WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!schoolResult.rows[0]) return res.status(404).json({ error: 'École introuvable' })

    const listsResult = await query('SELECT id FROM lists WHERE "schoolId" = $1', [req.params.id])
    const listIds = listsResult.rows.map(l => l.id)
    if (listIds.length) {
      await query('DELETE FROM list_items WHERE "listId" = ANY($1)', [listIds])
      await query('DELETE FROM lists WHERE id = ANY($1)', [listIds])
    }
    await query('DELETE FROM schools WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

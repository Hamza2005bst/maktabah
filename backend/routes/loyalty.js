const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 1, standard: 5, premium: Infinity }
router.use(auth)

router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM loyalty_settings WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows[0] || { storeId: req.user.id, pointsPerDh: 1, pointsForDh: 25 })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const { pointsPerDh, pointsForDh } = req.body
    const existingResult = await query('SELECT id FROM loyalty_settings WHERE "storeId" = $1', [req.user.id])
    if (existingResult.rows[0]) {
      await query('UPDATE loyalty_settings SET "pointsPerDh"=$1, "pointsForDh"=$2 WHERE "storeId"=$3', [pointsPerDh, pointsForDh, req.user.id])
    } else {
      await query(
        'INSERT INTO loyalty_settings (id, "storeId", "pointsPerDh", "pointsForDh") VALUES ($1,$2,$3,$4)',
        [uid(), req.user.id, pointsPerDh, pointsForDh]
      )
    }
    res.json({ storeId: req.user.id, pointsPerDh, pointsForDh })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/cards', async (req, res) => {
  try {
    const result = await query('SELECT * FROM loyalty_cards WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/cards', async (req, res) => {
  try {
    const { name, phone, id: providedId } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    const limit = LIMITS[req.user.plan] ?? Infinity
    const countResult = await query('SELECT COUNT(*) as n FROM loyalty_cards WHERE "storeId" = $1', [req.user.id])
    if (parseInt(countResult.rows[0].n) >= limit) return res.status(403).json({ error: 'planLimit' })
    const id = providedId || uid()
    await query(
      'INSERT INTO loyalty_cards (id, "storeId", name, phone, points) VALUES ($1,$2,$3,$4,$5)',
      [id, req.user.id, name, phone || '', 0]
    )
    res.status(201).json({ id, storeId: req.user.id, name, phone: phone || '', points: 0 })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/cards/:id', async (req, res) => {
  try {
    const cardResult = await query('SELECT * FROM loyalty_cards WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const card = cardResult.rows[0]
    if (!card) return res.status(404).json({ error: 'Carte introuvable' })
    const newName = req.body.name ?? card.name
    const newPhone = req.body.phone ?? card.phone
    await query('UPDATE loyalty_cards SET name=$1, phone=$2 WHERE id=$3', [newName, newPhone, req.params.id])
    res.json({ ...card, name: newName, phone: newPhone })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/cards/:id/points', async (req, res) => {
  try {
    const cardResult = await query('SELECT * FROM loyalty_cards WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const card = cardResult.rows[0]
    if (!card) return res.status(404).json({ error: 'Carte introuvable' })
    const newPoints = Math.max(0, card.points + (req.body.delta || 0))
    await query('UPDATE loyalty_cards SET points = $1 WHERE id = $2', [newPoints, req.params.id])
    res.json({ ...card, points: newPoints })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/cards/:id', async (req, res) => {
  try {
    const cardResult = await query('SELECT * FROM loyalty_cards WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!cardResult.rows[0]) return res.status(404).json({ error: 'Carte introuvable' })
    await query('DELETE FROM loyalty_cards WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

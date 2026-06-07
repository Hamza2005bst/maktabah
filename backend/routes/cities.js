const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM cities WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    const id = uid()
    await query('INSERT INTO cities (id, name, "storeId") VALUES ($1, $2, $3)', [id, name, req.user.id])
    res.status(201).json({ id, name, storeId: req.user.id })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const cityResult = await query('SELECT * FROM cities WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!cityResult.rows[0]) return res.status(404).json({ error: 'Ville introuvable' })

    const schoolsResult = await query('SELECT id FROM schools WHERE "cityId" = $1', [req.params.id])
    const schoolIds = schoolsResult.rows.map(s => s.id)
    if (schoolIds.length) {
      const listsResult = await query('SELECT id FROM lists WHERE "schoolId" = ANY($1)', [schoolIds])
      const listIds = listsResult.rows.map(l => l.id)
      if (listIds.length) {
        await query('DELETE FROM list_items WHERE "listId" = ANY($1)', [listIds])
        await query('DELETE FROM lists WHERE id = ANY($1)', [listIds])
      }
      await query('DELETE FROM schools WHERE id = ANY($1)', [schoolIds])
    }
    await query('DELETE FROM cities WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

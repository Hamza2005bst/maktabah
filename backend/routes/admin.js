const express = require('express')
const { query } = require('../db/database')
const { auth, adminOnly } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
router.use(auth, adminOnly)

function sanitizeStore(s) {
  const { password, ...rest } = s
  return rest
}

async function buildDefaultData(storeId) {
  const cats = [
    { name: 'Cahiers petits format', colorIndex: 0 }, { name: 'Cahiers grands format', colorIndex: 1 },
    { name: 'Livres', colorIndex: 2 }, { name: 'Trousse', colorIndex: 3 },
    { name: 'Couvertures', colorIndex: 4 }, { name: 'Divers', colorIndex: 5 },
  ]
  const catIds = []
  for (const c of cats) {
    const id = uid()
    await query('INSERT INTO categories (id, name, "colorIndex", "storeId") VALUES ($1,$2,$3,$4)', [id, c.name, c.colorIndex, storeId])
    catIds.push({ id, ...c })
  }
  const prods = [
    ['Cahier 48', catIds[0].id], ['Cahier 96', catIds[0].id], ['Cahier 144', catIds[1].id], ['Cahier 192', catIds[1].id],
    ["Coquelicot 6 Manuel de l'élève", catIds[2].id], ["Coquelicot 6 Livret d'activité", catIds[2].id],
    ['Stylo bleu Bic', catIds[3].id], ['Stylo vert Bic', catIds[3].id], ['Stylo noir Bic', catIds[3].id], ['Stylo rouge Bic', catIds[3].id],
    ['Règle', catIds[3].id], ['Gomme Maped', catIds[3].id], ['Gomme normal', catIds[3].id],
    ['Crayon Maped', catIds[3].id], ['Crayon normal', catIds[3].id], ['Crayons colorées Maped', catIds[3].id], ['Crayons colorées normal', catIds[3].id],
    ['Grande format', catIds[4].id], ['Petite format', catIds[4].id],
  ]
  for (const [name, catId] of prods) {
    await query('INSERT INTO products (id, name, price, "costPrice", "categoryId", "storeId") VALUES ($1,$2,$3,$4,$5,$6)', [uid(), name, 0, 0, catId, storeId])
  }
}

router.get('/stores', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stores')
    res.json(result.rows.map(sanitizeStore))
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/stores/:id', async (req, res) => {
  try {
    const storeResult = await query('SELECT * FROM stores WHERE id = $1', [req.params.id])
    const store = storeResult.rows[0]
    if (!store) return res.status(404).json({ error: 'Store introuvable' })
    const data = req.body
    if (data.active && !store.active && !['gratuit', 'admin'].includes(store.plan)) {
      const countResult = await query('SELECT COUNT(*) as n FROM categories WHERE "storeId" = $1', [req.params.id])
      if (!parseInt(countResult.rows[0].n)) await buildDefaultData(req.params.id)
    }
    await query(
      `UPDATE stores SET "storeName"=$1, phone=$2, email=$3, plan=$4, paid=$5, active=$6, pending=$7, "startDate"=$8, "endDate"=$9, "pendingPlan"=$10 WHERE id=$11`,
      [
        data.storeName ?? store.storeName,
        data.phone ?? store.phone,
        data.email ?? store.email,
        data.plan ?? store.plan,
        data.paid != null ? !!data.paid : store.paid,
        data.active != null ? !!data.active : store.active,
        data.pending != null ? !!data.pending : store.pending,
        data.startDate ?? store.startDate,
        data.endDate ?? store.endDate,
        data.pendingPlan ?? store.pendingPlan,
        req.params.id,
      ]
    )
    const updatedResult = await query('SELECT * FROM stores WHERE id = $1', [req.params.id])
    res.json(sanitizeStore(updatedResult.rows[0]))
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/stores/:id/active', async (req, res) => {
  try {
    const storeResult = await query('SELECT * FROM stores WHERE id = $1', [req.params.id])
    const store = storeResult.rows[0]
    if (!store) return res.status(404).json({ error: 'Store introuvable' })
    const newActive = !store.active
    if (newActive && !['gratuit', 'admin'].includes(store.plan)) {
      const countResult = await query('SELECT COUNT(*) as n FROM categories WHERE "storeId" = $1', [req.params.id])
      if (!parseInt(countResult.rows[0].n)) await buildDefaultData(req.params.id)
    }
    await query('UPDATE stores SET active=$1 WHERE id=$2', [newActive, req.params.id])
    res.json(sanitizeStore({ ...store, active: newActive }))
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/stores/:id', async (req, res) => {
  try {
    if (req.params.id === 'admin') return res.status(403).json({ error: "Impossible de supprimer l'admin" })
    await query('DELETE FROM stores WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/sales', async (req, res) => {
  try {
    const salesResult = await query('SELECT * FROM sales ORDER BY "rawDate" DESC')
    const itemsResult = await query('SELECT * FROM sale_items')
    res.json({ sales: salesResult.rows, saleItems: itemsResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/cities', async (req, res) => {
  try {
    const result = await query('SELECT * FROM admin_cities')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/cities', async (req, res) => {
  try {
    const { name, id } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    const newId = id || uid()
    await query('INSERT INTO admin_cities (id, name) VALUES ($1, $2)', [newId, name])
    res.status(201).json({ id: newId, name })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/cities/:id', async (req, res) => {
  try {
    const schoolsResult = await query('SELECT id FROM admin_schools WHERE "cityId" = $1', [req.params.id])
    const schoolIds = schoolsResult.rows.map(s => s.id)
    if (schoolIds.length) {
      const listsResult = await query('SELECT id FROM admin_lists WHERE "schoolId" = ANY($1)', [schoolIds])
      const listIds = listsResult.rows.map(l => l.id)
      if (listIds.length) {
        await query('DELETE FROM admin_list_items WHERE "listId" = ANY($1)', [listIds])
        await query('DELETE FROM admin_lists WHERE id = ANY($1)', [listIds])
      }
      await query('DELETE FROM admin_schools WHERE id = ANY($1)', [schoolIds])
    }
    await query('DELETE FROM admin_cities WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/schools', async (req, res) => {
  try {
    const result = await query('SELECT * FROM admin_schools')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/schools', async (req, res) => {
  try {
    const { name, cityId, id } = req.body
    if (!name || !cityId) return res.status(400).json({ error: 'Champs manquants' })
    const newId = id || uid()
    await query('INSERT INTO admin_schools (id, name, "cityId") VALUES ($1, $2, $3)', [newId, name, cityId])
    res.status(201).json({ id: newId, name, cityId })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/schools/:id', async (req, res) => {
  try {
    const listsResult = await query('SELECT id FROM admin_lists WHERE "schoolId" = $1', [req.params.id])
    const listIds = listsResult.rows.map(l => l.id)
    if (listIds.length) {
      await query('DELETE FROM admin_list_items WHERE "listId" = ANY($1)', [listIds])
      await query('DELETE FROM admin_lists WHERE id = ANY($1)', [listIds])
    }
    await query('DELETE FROM admin_schools WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/lists', async (req, res) => {
  try {
    const listsResult = await query('SELECT * FROM admin_lists')
    const itemsResult = await query('SELECT * FROM admin_list_items')
    res.json({ lists: listsResult.rows, listItems: itemsResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/lists', async (req, res) => {
  try {
    const { existingListId, schoolId, gradeName, items } = req.body
    if (!schoolId || !gradeName) return res.status(400).json({ error: 'Champs manquants' })
    const listId = existingListId || uid()
    if (!existingListId) {
      await query('INSERT INTO admin_lists (id, name, "schoolId") VALUES ($1, $2, $3)', [listId, gradeName, schoolId])
    }
    await query('DELETE FROM admin_list_items WHERE "listId" = $1', [listId])
    for (const it of (items || [])) {
      await query(
        'INSERT INTO admin_list_items (id, "listId", "productName", quantity, "unitPrice") VALUES ($1,$2,$3,$4,$5)',
        [uid(), listId, it.productName, it.quantity, it.unitPrice]
      )
    }
    const listResult = await query('SELECT * FROM admin_lists WHERE id = $1', [listId])
    const listItemsResult = await query('SELECT * FROM admin_list_items WHERE "listId" = $1', [listId])
    res.status(201).json({ list: listResult.rows[0], listItems: listItemsResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/lists/:id', async (req, res) => {
  try {
    await query('DELETE FROM admin_list_items WHERE "listId" = $1', [req.params.id])
    await query('DELETE FROM admin_lists WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

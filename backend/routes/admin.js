const express = require('express')
const db = require('../db/database')
const { auth, adminOnly } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
router.use(auth, adminOnly)

function sanitizeStore(s) {
  const { password, ...rest } = s
  return { ...rest, paid: !!rest.paid, active: !!rest.active, pending: !!rest.pending }
}

function buildDefaultData(storeId) {
  const cats = [
    { name: 'Cahiers petits format', colorIndex: 0 },{ name: 'Cahiers grands format', colorIndex: 1 },
    { name: 'Livres', colorIndex: 2 },{ name: 'Trousse', colorIndex: 3 },
    { name: 'Couvertures', colorIndex: 4 },{ name: 'Divers', colorIndex: 5 },
  ]
  const insC = db.prepare('INSERT INTO categories VALUES (?,?,?,?)')
  const catIds = cats.map(c => { const id = uid(); insC.run(id, c.name, c.colorIndex, storeId); return { id, ...c } })
  const prods = [
    ['Cahier 48', catIds[0].id],['Cahier 96', catIds[0].id],['Cahier 144', catIds[1].id],['Cahier 192', catIds[1].id],
    ["Coquelicot 6 Manuel de l'élève", catIds[2].id],["Coquelicot 6 Livret d'activité", catIds[2].id],
    ['Stylo bleu Bic', catIds[3].id],['Stylo vert Bic', catIds[3].id],['Stylo noir Bic', catIds[3].id],['Stylo rouge Bic', catIds[3].id],
    ['Règle', catIds[3].id],['Gomme Maped', catIds[3].id],['Gomme normal', catIds[3].id],
    ['Crayon Maped', catIds[3].id],['Crayon normal', catIds[3].id],['Crayons colorées Maped', catIds[3].id],['Crayons colorées normal', catIds[3].id],
    ['Grande format', catIds[4].id],['Petite format', catIds[4].id],
  ]
  const insP = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?)')
  prods.forEach(([name, catId]) => insP.run(uid(), name, 0, 0, catId, storeId))
}

router.get('/stores', (req, res) => res.json(db.prepare('SELECT * FROM stores').all().map(sanitizeStore)))

router.put('/stores/:id', (req, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id)
  if (!store) return res.status(404).json({ error: 'Store introuvable' })
  const data = req.body
  if (data.active && !store.active && !['gratuit', 'admin'].includes(store.plan)) {
    if (!db.prepare('SELECT COUNT(*) as n FROM categories WHERE storeId = ?').get(req.params.id).n) buildDefaultData(req.params.id)
  }
  db.prepare(`UPDATE stores SET storeName=?,phone=?,email=?,plan=?,paid=?,active=?,pending=?,startDate=?,endDate=?,pendingPlan=? WHERE id=?`)
    .run(
      data.storeName ?? store.storeName, data.phone ?? store.phone, data.email ?? store.email,
      data.plan ?? store.plan,
      data.paid != null ? (data.paid ? 1 : 0) : store.paid,
      data.active != null ? (data.active ? 1 : 0) : store.active,
      data.pending != null ? (data.pending ? 1 : 0) : store.pending,
      data.startDate ?? store.startDate, data.endDate ?? store.endDate,
      data.pendingPlan ?? store.pendingPlan, req.params.id
    )
  res.json(sanitizeStore(db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id)))
})

router.patch('/stores/:id/active', (req, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id)
  if (!store) return res.status(404).json({ error: 'Store introuvable' })
  const newActive = store.active ? 0 : 1
  if (newActive && !['gratuit', 'admin'].includes(store.plan)) {
    if (!db.prepare('SELECT COUNT(*) as n FROM categories WHERE storeId = ?').get(req.params.id).n) buildDefaultData(req.params.id)
  }
  db.prepare('UPDATE stores SET active=? WHERE id=?').run(newActive, req.params.id)
  res.json(sanitizeStore({ ...store, active: newActive }))
})

router.delete('/stores/:id', (req, res) => {
  if (req.params.id === 'admin') return res.status(403).json({ error: "Impossible de supprimer l'admin" })
  db.prepare('DELETE FROM stores WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/sales', (req, res) => {
  const sales = db.prepare('SELECT * FROM sales ORDER BY rawDate DESC').all()
  const items = db.prepare('SELECT * FROM sale_items').all()
  res.json({ sales: sales.map(s => ({ ...s, paid: !!s.paid })), saleItems: items })
})

router.get('/cities', (req, res) => res.json(db.prepare('SELECT * FROM admin_cities').all()))
router.post('/cities', (req, res) => {
  const { name, id } = req.body
  if (!name) return res.status(400).json({ error: 'Nom requis' })
  const newId = id || uid()
  db.prepare('INSERT INTO admin_cities VALUES (?,?)').run(newId, name)
  res.status(201).json({ id: newId, name })
})
router.delete('/cities/:id', (req, res) => {
  const schoolIds = db.prepare('SELECT id FROM admin_schools WHERE cityId = ?').all(req.params.id).map(s => s.id)
  if (schoolIds.length) {
    const listIds = db.prepare(`SELECT id FROM admin_lists WHERE schoolId IN (${schoolIds.map(() => '?').join(',')})`).all(...schoolIds).map(l => l.id)
    if (listIds.length) {
      db.prepare(`DELETE FROM admin_list_items WHERE listId IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
      db.prepare(`DELETE FROM admin_lists WHERE id IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
    }
    db.prepare(`DELETE FROM admin_schools WHERE id IN (${schoolIds.map(() => '?').join(',')})`).run(...schoolIds)
  }
  db.prepare('DELETE FROM admin_cities WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/schools', (req, res) => res.json(db.prepare('SELECT * FROM admin_schools').all()))
router.post('/schools', (req, res) => {
  const { name, cityId, id } = req.body
  if (!name || !cityId) return res.status(400).json({ error: 'Champs manquants' })
  const newId = id || uid()
  db.prepare('INSERT INTO admin_schools VALUES (?,?,?)').run(newId, name, cityId)
  res.status(201).json({ id: newId, name, cityId })
})
router.delete('/schools/:id', (req, res) => {
  const listIds = db.prepare('SELECT id FROM admin_lists WHERE schoolId = ?').all(req.params.id).map(l => l.id)
  if (listIds.length) {
    db.prepare(`DELETE FROM admin_list_items WHERE listId IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
    db.prepare(`DELETE FROM admin_lists WHERE id IN (${listIds.map(() => '?').join(',')})`).run(...listIds)
  }
  db.prepare('DELETE FROM admin_schools WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/lists', (req, res) => {
  res.json({ lists: db.prepare('SELECT * FROM admin_lists').all(), listItems: db.prepare('SELECT * FROM admin_list_items').all() })
})
router.post('/lists', (req, res) => {
  const { existingListId, schoolId, gradeName, items } = req.body
  if (!schoolId || !gradeName) return res.status(400).json({ error: 'Champs manquants' })
  const listId = existingListId || uid()
  if (!existingListId) db.prepare('INSERT INTO admin_lists VALUES (?,?,?)').run(listId, gradeName, schoolId)
  db.prepare('DELETE FROM admin_list_items WHERE listId = ?').run(listId)
  const insItem = db.prepare('INSERT INTO admin_list_items VALUES (?,?,?,?,?)')
  ;(items || []).forEach(it => insItem.run(uid(), listId, it.productName, it.quantity, it.unitPrice))
  res.status(201).json({
    list: db.prepare('SELECT * FROM admin_lists WHERE id = ?').get(listId),
    listItems: db.prepare('SELECT * FROM admin_list_items WHERE listId = ?').all(listId),
  })
})
router.delete('/lists/:id', (req, res) => {
  db.prepare('DELETE FROM admin_list_items WHERE listId = ?').run(req.params.id)
  db.prepare('DELETE FROM admin_lists WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

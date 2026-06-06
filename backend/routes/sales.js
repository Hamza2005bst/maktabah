const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtT = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
router.use(auth)

router.get('/', (req, res) => {
  const sales = db.prepare('SELECT * FROM sales WHERE storeId = ? ORDER BY rawDate DESC').all(req.user.id)
  const saleIds = sales.map(s => s.id)
  let items = []
  if (saleIds.length) items = db.prepare(`SELECT * FROM sale_items WHERE saleId IN (${saleIds.map(() => '?').join(',')})`).all(...saleIds)
  res.json({ sales: sales.map(s => ({ ...s, paid: !!s.paid })), saleItems: items })
})

router.post('/', (req, res) => {
  const { clientName, cartItems, loyaltyOpts } = req.body
  if (!cartItems || !Array.isArray(cartItems)) return res.status(400).json({ error: 'cartItems requis' })
  const opts = loyaltyOpts || {}
  const rawTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = Math.max(0, rawTotal - (opts.discountDh || 0))
  const saleId = uid()
  const now = new Date()
  db.prepare(`INSERT INTO sales (id,storeId,clientName,date,time,total,paid,rawDate,loyaltyCardId,pointsEarned,pointsRedeemed) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(saleId, req.user.id, clientName || '', fmtD(now), fmtT(now), total, 0, now.toISOString(), opts.cardId || null, opts.pointsEarned || 0, opts.pointsRedeemed || 0)
  const insItem = db.prepare('INSERT INTO sale_items VALUES (?,?,?,?,?,?,?)')
  const createdItems = cartItems.map(i => {
    const id = uid()
    insItem.run(id, saleId, i.id, i.name, i.quantity, i.price, i.costPrice || 0)
    return { id, saleId, productId: i.id, productName: i.name, quantity: i.quantity, price: i.price, costPrice: i.costPrice || 0 }
  })
  if (opts.cardId) {
    db.prepare('UPDATE loyalty_cards SET points = MAX(0, points - ? + ?) WHERE id = ?')
      .run(opts.pointsRedeemed || 0, opts.pointsEarned || 0, opts.cardId)
  }
  res.status(201).json({
    sale: { id: saleId, storeId: req.user.id, clientName: clientName || '', date: fmtD(now), time: fmtT(now), total, paid: false, rawDate: now.toISOString(), loyaltyCardId: opts.cardId || null, pointsEarned: opts.pointsEarned || 0, pointsRedeemed: opts.pointsRedeemed || 0 },
    saleItems: createdItems,
  })
})

router.patch('/:id/paid', (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!sale) return res.status(404).json({ error: 'Vente introuvable' })
  const newPaid = sale.paid ? 0 : 1
  db.prepare('UPDATE sales SET paid = ? WHERE id = ?').run(newPaid, req.params.id)
  res.json({ ...sale, paid: !!newPaid })
})

module.exports = router

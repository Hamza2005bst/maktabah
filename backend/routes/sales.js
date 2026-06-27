const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtT = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const salesResult = await query('SELECT * FROM sales WHERE "storeId" = $1 ORDER BY "rawDate" DESC', [req.user.id])
    const sales = salesResult.rows
    const saleIds = sales.map(s => s.id)
    let items = []
    if (saleIds.length) {
      const itemsResult = await query('SELECT * FROM sale_items WHERE "saleId" = ANY($1)', [saleIds])
      items = itemsResult.rows
    }
    res.json({ sales, saleItems: items })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { clientName, cartItems, loyaltyOpts } = req.body
    if (!cartItems || !Array.isArray(cartItems)) return res.status(400).json({ error: 'cartItems requis' })
    const opts = loyaltyOpts || {}
    const rawTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const total = Math.max(0, rawTotal - (opts.discountDh || 0))
    const saleId = uid()
    const now = new Date()
    const lastNum = await query('SELECT COALESCE(MAX("ticketNumber"), 0) AS max FROM sales WHERE "storeId" = $1', [req.user.id])
    const ticketNumber = lastNum.rows[0].max + 1
    await query(
      `INSERT INTO sales (id, "storeId", "clientName", date, time, total, paid, "rawDate", "loyaltyCardId", "pointsEarned", "pointsRedeemed", "ticketNumber") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [saleId, req.user.id, clientName || '', fmtD(now), fmtT(now), total, false, now.toISOString(), opts.cardId || null, opts.pointsEarned || 0, opts.pointsRedeemed || 0, ticketNumber]
    )
    const createdItems = []
    for (const i of cartItems) {
      const id = uid()
      await query(
        'INSERT INTO sale_items (id, "saleId", "productId", "productName", quantity, price, "costPrice") VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [id, saleId, i.id, i.name, i.quantity, i.price, i.costPrice || 0]
      )
      createdItems.push({ id, saleId, productId: i.id, productName: i.name, quantity: i.quantity, price: i.price, costPrice: i.costPrice || 0 })
    }
    if (opts.cardId) {
      await query(
        'UPDATE loyalty_cards SET points = GREATEST(0, points - $1 + $2) WHERE id = $3 AND "storeId" = $4',
        [opts.pointsRedeemed || 0, opts.pointsEarned || 0, opts.cardId, req.user.id]
      )
    }
    res.status(201).json({
      sale: {
        id: saleId, storeId: req.user.id, clientName: clientName || '',
        date: fmtD(now), time: fmtT(now), total, paid: false,
        rawDate: now.toISOString(), loyaltyCardId: opts.cardId || null,
        pointsEarned: opts.pointsEarned || 0, pointsRedeemed: opts.pointsRedeemed || 0,
        ticketNumber,
      },
      saleItems: createdItems,
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/:id/paid', async (req, res) => {
  try {
    const saleResult = await query('SELECT * FROM sales WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const sale = saleResult.rows[0]
    if (!sale) return res.status(404).json({ error: 'Vente introuvable' })
    const newPaid = !sale.paid
    await query('UPDATE sales SET paid = $1 WHERE id = $2', [newPaid, req.params.id])
    res.json({ ...sale, paid: newPaid })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

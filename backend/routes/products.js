const express = require('express')
const { query } = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 3, standard: Infinity, premium: Infinity }

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE "storeId" = $1', [req.user.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, price, costPrice, categoryId, barcode } = req.body
    if (!name || !categoryId) return res.status(400).json({ error: 'Champs manquants' })
    const limit = LIMITS[req.user.plan] ?? Infinity
    const countResult = await query(
      'SELECT COUNT(*) as n FROM products WHERE "storeId" = $1 AND "categoryId" = $2',
      [req.user.id, categoryId]
    )
    if (parseInt(countResult.rows[0].n) >= limit) return res.status(403).json({ error: 'planLimit' })
    const id = uid()
    await query(
      'INSERT INTO products (id, name, price, "costPrice", "categoryId", "storeId", barcode) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, name, price ?? 0, costPrice ?? 0, categoryId, req.user.id, barcode ?? null]
    )
    res.status(201).json({ id, name, price: price ?? 0, costPrice: costPrice ?? 0, categoryId, storeId: req.user.id, barcode: barcode ?? null })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const productResult = await query('SELECT * FROM products WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    const product = productResult.rows[0]
    if (!product) return res.status(404).json({ error: 'Produit introuvable' })
    const { name, price, costPrice, categoryId, barcode } = req.body
    await query(
      'UPDATE products SET name=$1, price=$2, "costPrice"=$3, "categoryId"=$4, barcode=$5 WHERE id=$6',
      [name ?? product.name, price ?? product.price, costPrice ?? product.costPrice, categoryId ?? product.categoryId, barcode !== undefined ? barcode : product.barcode, req.params.id]
    )
    res.json({
      ...product,
      name: name ?? product.name,
      price: price ?? product.price,
      costPrice: costPrice ?? product.costPrice,
      categoryId: categoryId ?? product.categoryId,
      barcode: barcode !== undefined ? barcode : product.barcode,
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const productResult = await query('SELECT * FROM products WHERE id = $1 AND "storeId" = $2', [req.params.id, req.user.id])
    if (!productResult.rows[0]) return res.status(404).json({ error: 'Produit introuvable' })
    await query('DELETE FROM list_items WHERE "productId" = $1', [req.params.id])
    await query('DELETE FROM products WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

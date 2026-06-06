const express = require('express')
const db = require('../db/database')
const { auth } = require('../middleware/auth')

const router = express.Router()
const uid = () => Math.random().toString(36).slice(2, 10)
const LIMITS = { gratuit: 3, standard: Infinity, premium: Infinity }

router.use(auth)

router.get('/', (req, res) => res.json(db.prepare('SELECT * FROM products WHERE storeId = ?').all(req.user.id)))

router.post('/', (req, res) => {
  const { name, price, costPrice, categoryId } = req.body
  if (!name || !categoryId) return res.status(400).json({ error: 'Champs manquants' })
  const limit = LIMITS[req.user.plan] ?? Infinity
  const count = db.prepare('SELECT COUNT(*) as n FROM products WHERE storeId = ? AND categoryId = ?').get(req.user.id, categoryId).n
  if (count >= limit) return res.status(403).json({ error: 'planLimit' })
  const id = uid()
  db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?)').run(id, name, price ?? 0, costPrice ?? 0, categoryId, req.user.id)
  res.status(201).json({ id, name, price: price ?? 0, costPrice: costPrice ?? 0, categoryId, storeId: req.user.id })
})

router.put('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!product) return res.status(404).json({ error: 'Produit introuvable' })
  const { name, price, costPrice, categoryId } = req.body
  db.prepare('UPDATE products SET name=?,price=?,costPrice=?,categoryId=? WHERE id=?')
    .run(name ?? product.name, price ?? product.price, costPrice ?? product.costPrice, categoryId ?? product.categoryId, req.params.id)
  res.json({ ...product, name: name ?? product.name, price: price ?? product.price, costPrice: costPrice ?? product.costPrice, categoryId: categoryId ?? product.categoryId })
})

router.delete('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND storeId = ?').get(req.params.id, req.user.id)
  if (!product) return res.status(404).json({ error: 'Produit introuvable' })
  db.prepare('DELETE FROM list_items WHERE productId = ?').run(req.params.id)
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

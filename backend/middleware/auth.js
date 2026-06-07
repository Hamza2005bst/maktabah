const jwt = require('jsonwebtoken')
const db = require('../db/database')

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    const store = db.prepare('SELECT id, role, plan, active, endDate FROM stores WHERE id = ?').get(payload.id)
    if (!store) return res.status(401).json({ error: 'Compte introuvable' })
    if (!store.active && store.role !== 'admin') return res.status(403).json({ error: 'accountInactive' })
    if (store.role !== 'admin' && store.plan !== 'gratuit' && store.endDate) {
      const today = new Date().toISOString().split('T')[0]
      if (store.endDate < today) {
        db.prepare('UPDATE stores SET active = 0 WHERE id = ?').run(store.id)
        return res.status(403).json({ error: 'subscriptionExpired' })
      }
    }
    req.user = { id: store.id, role: store.role, plan: store.plan }
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Accès réservé à l'admin" })
  }
  next()
}

module.exports = { auth, adminOnly }

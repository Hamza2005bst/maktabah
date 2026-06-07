const jwt = require('jsonwebtoken')
const { query } = require('../db/database')

async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  let payload
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token invalide' })
  }
  try {
    const result = await query(
      'SELECT id, role, plan, active, "endDate" FROM stores WHERE id = $1',
      [payload.id]
    )
    const store = result.rows[0]
    if (!store) return res.status(401).json({ error: 'Compte introuvable' })
    if (!store.active && store.role !== 'admin') return res.status(403).json({ error: 'accountInactive' })
    if (store.role !== 'admin' && store.plan !== 'gratuit' && store.endDate) {
      const today = new Date().toISOString().split('T')[0]
      if (store.endDate < today) {
        await query('UPDATE stores SET active = FALSE WHERE id = $1', [store.id])
        return res.status(403).json({ error: 'subscriptionExpired' })
      }
    }
    req.user = { id: store.id, role: store.role, plan: store.plan }
    next()
  } catch (err) {
    next(err)
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Accès réservé à l'admin" })
  }
  next()
}

module.exports = { auth, adminOnly }

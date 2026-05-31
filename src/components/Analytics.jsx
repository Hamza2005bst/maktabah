import { useMemo } from 'react'
import { useState } from 'react'
import { formatMoney } from '../constants.js'

export default function Analytics({ t, sales, saleItems }) {
  const [period, setPeriod] = useState('today')

  const now = new Date()

  const filtered = useMemo(() => {
    return sales.filter(sale => {
      if (!sale.rawDate) return false
      const d = new Date(sale.rawDate)
      if (period === 'today') {
        return d.toDateString() === now.toDateString()
      } else if (period === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
        return d >= weekAgo
      } else {
        const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)
        return d >= monthAgo
      }
    })
  }, [sales, period])

  const filteredItems = useMemo(() => {
    const ids = new Set(filtered.map(s => s.id))
    return saleItems.filter(si => ids.has(si.saleId))
  }, [filtered, saleItems])

  const totalRevenue = filtered.reduce((s, sale) => s + sale.total, 0)
  const saleCount = filtered.length
  const avgCart = saleCount > 0 ? totalRevenue / saleCount : 0
  const netProfit = filteredItems.reduce((s, i) => s + (i.price - (i.costPrice || 0)) * i.quantity, 0)

  // Top 5 products
  const productQtys = {}
  filteredItems.forEach(i => {
    const key = i.productId || i.productName
    productQtys[key] = (productQtys[key] || { name: i.productName, qty: 0 })
    productQtys[key].qty += i.quantity
    productQtys[key].name = i.productName
  })
  const top5 = Object.values(productQtys).sort((a, b) => b.qty - a.qty).slice(0, 5)

  // Bar chart: last 14 days
  const last14 = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const dateStr = d.toDateString()
      const dayTotal = sales
        .filter(s => s.rawDate && new Date(s.rawDate).toDateString() === dateStr)
        .reduce((s, sale) => s + sale.total, 0)
      days.push({ label, total: dayTotal })
    }
    return days
  }, [sales])

  const maxBar = Math.max(...last14.map(d => d.total), 1)

  const kpis = [
    { icon: '💰', label: t('totalSales'), value: `${formatMoney(totalRevenue)} DH`, color: '#1D9E75', bg: '#E1F5EE' },
    { icon: '🧾', label: t('salesCount'), value: saleCount, color: '#3B82F6', bg: '#EFF6FF' },
    { icon: '📈', label: t('avgCart'), value: `${formatMoney(avgCart)} DH`, color: '#7C3AED', bg: '#F5F3FF' },
    { icon: '🏆', label: t('netProfit'), value: `${formatMoney(netProfit)} DH`, color: '#D97706', bg: '#FFFBEB' },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Period filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['today', t('today')], ['week', t('thisWeek')], ['month', t('thisMonth')]].map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: period === key ? '#1D9E75' : '#F3F4F6',
            color: period === key ? '#fff' : '#374151',
          }}>{label}</button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Bar chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{t('last14Days')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
            {last14.map((day, i) => {
              const h = maxBar > 0 ? Math.max(4, (day.total / maxBar) * 130) : 4
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {day.total > 0 && (
                    <div style={{ fontSize: 8, color: '#6B7280', fontWeight: 600 }}>{Math.round(day.total)}</div>
                  )}
                  <div style={{
                    width: '100%', background: day.total > 0 ? '#1D9E75' : '#E5E7EB',
                    borderRadius: '3px 3px 0 0', height: h, transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 8, color: '#9CA3AF', transform: 'rotate(-45deg)', transformOrigin: 'top right', whiteSpace: 'nowrap', marginTop: 8 }}>
                    {day.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 5 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{t('top5')}</div>
          {top5.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>—</div>
          ) : (
            top5.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? '#FFFBEB' : i === 1 ? '#F5F3FF' : '#F3F4F6',
                  color: i === 0 ? '#D97706' : i === 1 ? '#7C3AED' : '#6B7280',
                  fontSize: 12, fontWeight: 800,
                }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2433' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.qty} {t('soldUnits')}</div>
                </div>
                <div style={{ background: '#E1F5EE', borderRadius: 20, padding: '3px 10px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#085041' }}>{item.qty}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

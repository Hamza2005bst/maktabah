import { useState, useMemo } from 'react'
import { formatMoney } from '../constants.js'

export default function Sales({ t, currentUser, sales, saleItems, toggleSalePaid, products }) {
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [ticketSale, setTicketSale] = useState(null)

  const unpaid = sales.filter(s => !s.paid)
  const unpaidTotal = unpaid.reduce((s, sale) => s + sale.total, 0)

  const getItems = (saleId) => saleItems.filter(si => si.saleId === saleId)

  const filtered = useMemo(() => {
    return sales.filter(sale => {
      if (search && !sale.clientName?.toLowerCase().includes(search.toLowerCase())) return false
      if (filterDate && !sale.date?.includes(filterDate.split('-').reverse().join('/'))) return false
      if (filterProduct) {
        const items = getItems(sale.id)
        if (!items.some(i => i.productId === filterProduct)) return false
      }
      if (filterStatus === 'paid' && !sale.paid) return false
      if (filterStatus === 'unpaid' && sale.paid) return false
      return true
    }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
  }, [sales, saleItems, search, filterDate, filterProduct, filterStatus])

  const hasFilter = filterDate || filterProduct || filterStatus !== 'all'

  return (
    <div style={{ padding: 24 }}>
      {/* Unpaid banner */}
      {unpaid.length > 0 && (
        <div style={{ background: '#FAEEDA', color: '#633806', borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 14, fontWeight: 600 }}>
          ⚠️ {unpaid.length} {t('unpaidBanner')} {formatMoney(unpaidTotal)} DH
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9CA3AF' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('searchClient')}
          style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>×</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }} />
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }}>
          <option value="">— {t('filterProduct')}</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #E5E7EB' }}>
          {['all', 'paid', 'unpaid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: filterStatus === s ? '#1D2433' : '#fff',
              color: filterStatus === s ? '#fff' : '#374151',
            }}>{t(s === 'all' ? 'allStatus' : s)}</button>
          ))}
        </div>
        {hasFilter && (
          <button onClick={() => { setFilterDate(''); setFilterProduct(''); setFilterStatus('all') }}
            style={{ padding: '8px 12px', background: '#FCEBEB', color: '#E24B4A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t('clearFilter')}
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280' }}>{filtered.length} résultat(s)</div>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 15 }}>{t('noSales')}</div>
      ) : (
        filtered.map(sale => {
          const items = getItems(sale.id)
          const profit = items.reduce((s, i) => s + (i.price - (i.costPrice || 0)) * i.quantity, 0)
          const itemsSummary = items.slice(0, 2).map(i => `${i.quantity}× ${i.productName}`).join(', ')
          return (
            <div key={sale.id} onClick={() => setTicketSale(sale)} style={{
              background: '#fff', borderRadius: 10, padding: '14px 18px', marginBottom: 10, cursor: 'pointer',
              border: `1.5px solid ${sale.paid ? '#E5E7EB' : '#FAC775'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.12s',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{sale.date} {sale.time}</span>
                  {sale.clientName && (
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                      👤 {sale.clientName}
                    </span>
                  )}
                  {sale.paid
                    ? <span style={{ fontSize: 18 }}>✅</span>
                    : <span style={{ background: '#FAC775', color: '#92400e', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>✕</span>
                  }
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                  {itemsSummary}{items.length > 2 ? ` +${items.length - 2} autres` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1D2433' }}>{formatMoney(sale.total)} DH</div>
                  <div style={{ fontSize: 11, color: '#1D9E75' }}>+{formatMoney(profit)} DH</div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleSalePaid(sale.id) }} title={sale.paid ? t('markUnpaid') : t('markPaid')} style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: sale.paid ? 'transparent' : '#FAC775',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: sale.paid ? 22 : 14, fontWeight: 900,
                  color: '#92400e',
                }}>
                  {sale.paid ? '✅' : '✕'}
                </button>
              </div>
            </div>
          )
        })
      )}

      {/* Ticket modal */}
      {ticketSale && (
        <TicketModal
          sale={ticketSale}
          items={getItems(ticketSale.id)}
          storeName={currentUser?.storeName}
          toggleSalePaid={toggleSalePaid}
          onClose={() => setTicketSale(null)}
          t={t}
        />
      )}
    </div>
  )
}

function TicketModal({ sale, items, storeName, toggleSalePaid, onClose, t }) {
  const profit = items.reduce((s, i) => s + (i.price - (i.costPrice || 0)) * i.quantity, 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: 380, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{t('receipt')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF' }}>×</button>
        </div>

        {/* Receipt */}
        <div style={{ padding: '20px 24px', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 24 }}>📚</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{storeName}</div>
            <div style={{ color: '#6B7280' }}>{sale.date} — {sale.time}</div>
            {sale.clientName && <div style={{ fontWeight: 600 }}>{t('client')} : {sale.clientName}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0', marginBottom: 12 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{item.quantity}× {item.productName}</span>
                <span>{formatMoney(item.price * item.quantity)} DH</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            <span>TOTAL</span>
            <span>{formatMoney(sale.total)} DH</span>
          </div>
          <div style={{ fontSize: 12, color: '#1D9E75', marginBottom: 12 }}>
            {t('profit')} net: {formatMoney(profit)} DH
          </div>

          {/* Toggle paid */}
          <button onClick={() => toggleSalePaid(sale.id)} style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: sale.paid ? '#FCEBEB' : '#E1F5EE',
            color: sale.paid ? '#791F1F' : '#085041',
            fontSize: 15, fontWeight: 700, marginBottom: 12,
          }}>
            {sale.paid ? `⏳ ${t('markUnpaid')}` : `✅ ${t('markPaid')}`}
          </button>

          <div style={{ textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: 10, color: '#6B7280', fontSize: 12 }}>
            {t('thankYou')}
          </div>
        </div>

      </div>
    </div>
  )
}

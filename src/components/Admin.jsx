import { useState } from 'react'
import { PLANS, formatMoney } from '../constants.js'
import AdminLists from './AdminLists.jsx'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
  { code: 'en', label: 'EN' },
]

export default function Admin({ t, lang, setLang, stores, updateStore, toggleStoreActive, deleteStore, allSales, allSaleItems, logout,
  adminCities, adminSchools, adminLists, adminListItems,
  addAdminCity, deleteAdminCity, addAdminSchool, deleteAdminSchool, saveAdminList, deleteAdminList }) {
  const storeList = stores.filter(s => s.role !== 'admin' && !s.pending)
  const pendingList = stores.filter(s => s.pending || s.pendingPlan)
  const [tab, setTab] = useState(() => pendingList.length > 0 ? 'pendingRequests' : 'subscriptions')

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA' }}>
      {/* Topbar */}
      <div style={{ background: '#1D2433', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>📚</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{t('adminDashboard')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700,
              background: lang === l.code ? '#1D9E75' : 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
            }}>{l.label}</button>
          ))}
          <button onClick={logout} style={{ marginLeft: 8, padding: '6px 16px', background: '#E24B4A22', color: '#E24B4A', border: '1px solid #E24B4A44', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            ⏻ {t('logout')}
          </button>
        </div>
      </div>

      <div style={{ padding: 28 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[['subscriptions', t('subscriptions'), 0], ['pendingRequests', t('pendingRequests'), pendingList.length], ['globalAnalytics', t('globalAnalytics'), 0]].map(([tabKey, label, badge]) => (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              background: tab === tabKey ? '#1D2433' : '#fff',
              color: tab === tabKey ? '#fff' : '#374151',
              boxShadow: tab !== tabKey ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}>
              {label}
              {badge > 0 && (
                <span style={{ background: '#E24B4A', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 7px', lineHeight: 1.6 }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'subscriptions' && <Subscriptions stores={storeList} updateStore={updateStore} toggleStoreActive={toggleStoreActive} deleteStore={deleteStore} t={t} />}
        {tab === 'pendingRequests' && <PendingRequests stores={pendingList} updateStore={updateStore} deleteStore={deleteStore} t={t} />}
        {tab === 'globalAnalytics' && <GlobalAnalytics stores={storeList} allSales={allSales} allSaleItems={allSaleItems} t={t} />}
      </div>
    </div>
  )
}

function Subscriptions({ stores, updateStore, toggleStoreActive, deleteStore, t }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const expiringSoon = stores.filter(s =>
    s.plan !== 'gratuit' && s.endDate && s.active && s.endDate >= today && s.endDate <= in7Days
  )
  const expired = stores.filter(s =>
    s.plan !== 'gratuit' && s.endDate && s.active && s.endDate < today
  )

  const openEdit = (store) => {
    setEditingId(store.id)
    setEditForm({ plan: store.plan, paid: store.paid, active: store.active, startDate: store.startDate || '', endDate: store.endDate || '' })
  }

  const saveEdit = () => {
    updateStore(editingId, {
      plan: editForm.plan,
      paid: editForm.paid === true || editForm.paid === 'true',
      active: editForm.active === true || editForm.active === 'true',
      startDate: editForm.startDate,
      endDate: editForm.endDate,
    })
    setEditingId(null)
  }

  return (
    <div>
      {expired.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔴</span>
          <div>
            <strong style={{ color: '#991B1B', fontSize: 13 }}>Abonnements expirés ({expired.length}) — à renouveler :</strong>
            <span style={{ color: '#B91C1C', fontSize: 13, marginLeft: 8 }}>{expired.map(s => s.storeName).join(', ')}</span>
          </div>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400E', fontSize: 13 }}>{t('expiringSoon')} :</strong>
            <span style={{ color: '#B45309', fontSize: 13, marginLeft: 8 }}>{expiringSoon.map(s => `${s.storeName} (${s.endDate})`).join(', ')}</span>
          </div>
        </div>
      )}
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            {['Librairie', 'Contact', 'Plan', 'Paiement', t('status'), t('startDate'), t('endDate'), 'Actions'].map((h, i) => (
              <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stores.map(store => {
            const planInfo = PLANS[store.plan] || {}
            const isExpired = store.plan !== 'gratuit' && store.endDate && store.endDate < today
            const isExpiringSoon = !isExpired && store.plan !== 'gratuit' && store.endDate && store.endDate >= today && store.endDate <= in7Days
            return (
              <tr key={store.id} style={{ borderBottom: '1px solid #F3F4F6', background: isExpired ? '#FFF5F5' : isExpiringSoon ? '#FFFDF0' : 'transparent' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>{store.storeName}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                  <div>{store.phone}</div>
                  {store.email && <div>{store.email}</div>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 13 }}>
                      <option value="gratuit">Gratuit</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="gold">Gold</option>
                    </select>
                  ) : (
                    <span style={{ background: planInfo.bg || '#F3F4F6', color: planInfo.color || '#374151', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {planInfo.label || store.plan}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <select value={String(editForm.paid)} onChange={e => setEditForm(f => ({ ...f, paid: e.target.value === 'true' }))}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 13 }}>
                      <option value="true">{t('paid')}</option>
                      <option value="false">{t('unpaid')}</option>
                    </select>
                  ) : (
                    <span style={{ background: store.paid ? '#E1F5EE' : '#FCEBEB', color: store.paid ? '#085041' : '#791F1F', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {store.paid ? t('paid') : t('unpaid')}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <select value={String(editForm.active)} onChange={e => setEditForm(f => ({ ...f, active: e.target.value === 'true' }))}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 13 }}>
                      <option value="true">{t('active')}</option>
                      <option value="false">{t('inactive')}</option>
                    </select>
                  ) : (
                    <span style={{ background: store.active ? '#E1F5EE' : '#F3F4F6', color: store.active ? '#085041' : '#6B7280', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {store.active ? t('active') : t('inactive')}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 12 }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{store.startDate || '—'}</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 12 }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{store.endDate || '—'}</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingId === store.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={saveEdit} style={{ padding: '5px 12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('save')}</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', background: '#F3F4F6', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleStoreActive(store.id)} style={{
                        padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: store.active ? '#FCEBEB' : '#E1F5EE',
                        color: store.active ? '#791F1F' : '#085041',
                      }}>{store.active ? t('deactivate') : t('activate')}</button>
                      <button onClick={() => openEdit(store)} style={{ padding: '5px 10px', background: '#F3F4F6', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✏️</button>
                      {!store.active && (
                        <button onClick={() => { if (window.confirm(`Supprimer "${store.storeName}" ?`)) deleteStore(store.id) }} style={{
                          padding: '5px 10px', background: '#FCEBEB', color: '#791F1F',
                          border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                        }}>🗑️</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
          {stores.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucune librairie inscrite</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  )
}

function PendingRequests({ stores, updateStore, deleteStore, t }) {
  const handleAccept = (store) => {
    if (store.pendingPlan) {
      updateStore(store.id, { plan: store.pendingPlan, pendingPlan: null })
    } else {
      const today = new Date().toISOString().split('T')[0]
      const end = new Date()
      end.setFullYear(end.getFullYear() + 1)
      updateStore(store.id, {
        pending: false,
        active: true,
        startDate: today,
        endDate: end.toISOString().split('T')[0],
      })
    }
  }

  const handleReject = (id) => {
    if (window.confirm('Refuser et supprimer cette demande ?')) {
      deleteStore(id)
    }
  }

  if (stores.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: '60px 0', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontSize: 15 }}>
        {t('noPendingRequests')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stores.map(store => {
        const planInfo = PLANS[store.plan] || {}
        const isUpgrade = !!store.pendingPlan
        const pendingPlanInfo = isUpgrade ? (PLANS[store.pendingPlan] || {}) : null
        return (
          <div key={store.id} style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            borderLeft: `4px solid ${isUpgrade ? '#7C3AED' : '#F59E0B'}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1D2433' }}>{store.storeName}</div>
                {isUpgrade && (
                  <span style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    Changement de plan
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{store.phone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isUpgrade ? (
                  <>
                    <span style={{ background: planInfo.bg || '#F3F4F6', color: planInfo.color || '#374151', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {planInfo.label || store.plan}
                    </span>
                    <span style={{ fontSize: 14, color: '#9CA3AF' }}>→</span>
                    <span style={{ background: pendingPlanInfo.bg || '#F3F4F6', color: pendingPlanInfo.color || '#374151', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {pendingPlanInfo.label || store.pendingPlan}
                    </span>
                  </>
                ) : (
                  <span style={{ background: planInfo.bg || '#F3F4F6', color: planInfo.color || '#374151', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {planInfo.label || store.plan}
                  </span>
                )}
                {store.registeredAt && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{t('requestedOn')} {store.registeredAt}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleAccept(store)} style={{
                padding: '8px 20px', background: '#1D9E75', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                ✓ {t('accept')}
              </button>
              <button onClick={() => handleReject(store.id)} style={{
                padding: '8px 16px', background: '#FCEBEB', color: '#791F1F',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                ✕ {t('reject')}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GlobalAnalytics({ stores, allSales, allSaleItems, t }) {
  const activeCount = stores.filter(s => s.active).length
  const premiumCount = stores.filter(s => s.plan === 'premium' || s.plan === 'gold').length
  const subscriptionRevenue = stores.reduce((s, store) => {
    if (!store.paid) return s
    return s + (PLANS[store.plan]?.price || 0)
  }, 0)
  const platformTotal = allSales.reduce((s, sale) => s + sale.total, 0)

  const kpis = [
    { icon: '🏪', label: t('activeStores'), value: activeCount, color: '#1D9E75', bg: '#E1F5EE' },
    { icon: '⭐', label: t('premiumCount'), value: premiumCount, color: '#D97706', bg: '#FFFBEB' },
    { icon: '💵', label: t('subscriptionRevenue'), value: `${subscriptionRevenue} DH`, color: '#7C3AED', bg: '#F5F3FF' },
    { icon: '📊', label: t('platformSales'), value: `${formatMoney(platformTotal)} DH`, color: '#3B82F6', bg: '#EFF6FF' },
  ]

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Per-store grid */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Librairie', 'Plan', 'CA Total', 'Transactions'].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map(store => {
              const storeSales = allSales.filter(s => s.storeId === store.id)
              const storeRevenue = storeSales.reduce((s, sale) => s + sale.total, 0)
              const planInfo = PLANS[store.plan] || {}
              return (
                <tr key={store.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{store.storeName}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: planInfo.bg || '#F3F4F6', color: planInfo.color || '#374151', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {planInfo.label || store.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1D9E75' }}>{formatMoney(storeRevenue)} DH</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{storeSales.length}</td>
                </tr>
              )
            })}
            {stores.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

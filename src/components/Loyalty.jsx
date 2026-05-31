import { useState, useMemo } from 'react'
import { uid, formatMoney, PLAN_LIMITS, PLANS } from '../constants.js'

export default function Loyalty({
  t, currentUser, loyaltyCards, loyaltySetting,
  updateLoyaltySettings, addLoyaltyCard, updateLoyaltyCard, adjustLoyaltyPoints, deleteLoyaltyCard,
  showToast, showPlansModal,
}) {
  const [tab, setTab] = useState('clients')

  return (
    <div style={{ padding: 24 }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard icon="👥" label={t('totalClients')} value={loyaltyCards.length} color="#7C3AED" bg="#F5F3FF" />
        <KpiCard icon="⭐" label={t('totalPointsOut')} value={loyaltyCards.reduce((s, c) => s + c.points, 0).toLocaleString()} color="#D97706" bg="#FFFBEB" />
        <KpiCard icon="💰" label={t('loyaltyDhEquiv')} value={`${formatMoney(loyaltyCards.reduce((s, c) => s + c.points, 0) / loyaltySetting.pointsForDh)} DH`} color="#1D9E75" bg="#E1F5EE" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['clients', t('loyaltyClients')], ['loyaltySettings', t('loyaltySettings')]].map(([tabKey, label]) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: tab === tabKey ? '#1D2433' : '#fff',
            color: tab === tabKey ? '#fff' : '#374151',
            boxShadow: tab !== tabKey ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'clients' && (
        <ClientsTab
          currentUser={currentUser}
          loyaltyCards={loyaltyCards}
          loyaltySetting={loyaltySetting}
          addLoyaltyCard={addLoyaltyCard}
          updateLoyaltyCard={updateLoyaltyCard}
          adjustLoyaltyPoints={adjustLoyaltyPoints}
          deleteLoyaltyCard={deleteLoyaltyCard}
          showToast={showToast}
          showPlansModal={showPlansModal}
          t={t}
        />
      )}
      {tab === 'loyaltySettings' && (
        <SettingsTab
          loyaltySetting={loyaltySetting}
          updateLoyaltySettings={updateLoyaltySettings}
          showToast={showToast}
          t={t}
        />
      )}
    </div>
  )
}

function UpgradeModal({ onClose, onShowPlans, t }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420, width: '90%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1D2433', marginBottom: 8 }}>
            Limite atteinte
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            Le plan <strong>Gratuit</strong> est limité à <strong>1 client fidélité</strong>.<br />
            Passez à un plan supérieur pour en ajouter davantage.
          </div>
        </div>

        <button onClick={() => { onClose(); onShowPlans() }} style={{
          width: '100%', padding: '11px 0', background: '#1D2433', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', marginBottom: 10,
        }}>
          Voir les plans
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: '10px 0', background: '#F3F4F6', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151',
        }}>
          Fermer
        </button>
      </div>
    </div>
  )
}

function ClientsTab({ currentUser, loyaltyCards, loyaltySetting, addLoyaltyCard, updateLoyaltyCard, adjustLoyaltyPoints, deleteLoyaltyCard, showToast, showPlansModal, t }) {
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adjustingId, setAdjustingId] = useState(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustNote, setAdjustNote] = useState('+')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return loyaltyCards
    const q = search.toLowerCase()
    return loyaltyCards.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q))
  }, [loyaltyCards, search])

  const handleAdd = () => {
    if (!newName.trim()) return
    addLoyaltyCard({ name: newName.trim(), phone: newPhone.trim() })
    setNewName(''); setNewPhone(''); setShowAddForm(false)
    showToast(t('loyaltyClientAdded'))
  }

  const handleAdjust = (card) => {
    const delta = parseInt(adjustDelta)
    if (isNaN(delta) || delta <= 0) return
    adjustLoyaltyPoints(card.id, adjustNote === '+' ? delta : -delta)
    setAdjustingId(null); setAdjustDelta(''); setAdjustNote('+')
  }

  const dhEquiv = (pts) => formatMoney(pts / loyaltySetting.pointsForDh)

  return (
    <div>
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onShowPlans={showPlansModal} t={t} />}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14 }}
          />
        </div>
        <button onClick={() => {
          const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
          if (loyaltyCards.length >= limits.maxLoyalty) {
            setShowUpgradeModal(true)
          } else {
            setShowAddForm(true)
          }
        }} style={{
          padding: '9px 18px', background: '#1D9E75', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{t('addLoyaltyClient')}</button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, border: '1.5px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={lbl}>{t('loyaltyClientName')}</label>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={inp} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={lbl}>{t('loyaltyPhone')}</label>
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={inp} placeholder="0612345678" />
          </div>
          <button onClick={handleAdd} style={{ padding: '9px 18px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            {t('save')}
          </button>
          <button onClick={() => { setShowAddForm(false); setNewName(''); setNewPhone('') }}
            style={{ padding: '9px 12px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0' }}>{t('noLoyaltyCards')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(card => {
            const dh = dhEquiv(card.points)
            const pct = Math.min(100, (card.points / Math.max(...loyaltyCards.map(c => c.points), 1)) * 100)
            return (
              <div key={card.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1.5px solid #F3F4F6' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    {editingId === card.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          style={{ ...inp, padding: '5px 8px', fontSize: 13 }} />
                        <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                          style={{ ...inp, padding: '5px 8px', fontSize: 12 }} placeholder="Téléphone" />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { updateLoyaltyCard(card.id, { name: editName, phone: editPhone }); setEditingId(null) }}
                            style={{ padding: '4px 12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('save')}</button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', background: '#F3F4F6', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1D2433' }}>{card.name}</div>
                        {card.phone && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>📱 {card.phone}</div>}
                      </>
                    )}
                  </div>
                  {editingId !== card.id && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingId(card.id); setEditName(card.name); setEditPhone(card.phone || '') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2 }}>✏️</button>
                      <button onClick={() => deleteLoyaltyCard(card.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2, color: '#E24B4A' }}>🗑️</button>
                    </div>
                  )}
                </div>

                {/* Points display */}
                <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>{t('loyaltyPoints')}</div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{card.points.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>{t('loyaltyDhEquiv')}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{dh} DH</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 5 }}>
                    <div style={{ width: `${pct}%`, background: '#fff', borderRadius: 4, height: '100%', transition: 'width 0.4s' }} />
                  </div>
                </div>

                {/* Adjust points inline */}
                {adjustingId === card.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                      style={{ padding: '7px 8px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 14, fontWeight: 700, color: adjustNote === '+' ? '#1D9E75' : '#E24B4A' }}>
                      <option value="+">+</option>
                      <option value="-">−</option>
                    </select>
                    <input autoFocus type="number" min="1" value={adjustDelta}
                      onChange={e => setAdjustDelta(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdjust(card)}
                      placeholder="ex: 50"
                      style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
                    <button onClick={() => handleAdjust(card)}
                      style={{ padding: '7px 12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer' }}>✓</button>
                    <button onClick={() => { setAdjustingId(null); setAdjustDelta('') }}
                      style={{ padding: '7px 10px', background: '#F3F4F6', border: 'none', borderRadius: 7, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAdjustingId(card.id)} style={{
                    width: '100%', padding: '8px 0', background: '#F5F3FF', color: '#7C3AED',
                    border: '1.5px solid #DDD6FE', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    ✎ {t('manualAdjust')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SettingsTab({ loyaltySetting, updateLoyaltySettings, showToast, t }) {
  const [ptsPerDh, setPtsPerDh] = useState(loyaltySetting.pointsPerDh)
  const [ptsForDh, setPtsForDh] = useState(loyaltySetting.pointsForDh)

  const handleSave = () => {
    const p = parseFloat(ptsPerDh)
    const r = parseFloat(ptsForDh)
    if (isNaN(p) || p <= 0 || isNaN(r) || r <= 0) return
    updateLoyaltySettings({ pointsPerDh: p, pointsForDh: r })
    showToast(t('settingsSaved'))
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24, color: '#1D2433' }}>
          ⚙️ {t('loyaltySettings')}
        </div>

        {/* Earning rate */}
        <div style={{ marginBottom: 24, padding: 18, background: '#F5F3FF', borderRadius: 10, border: '1.5px solid #DDD6FE' }}>
          <div style={{ fontWeight: 700, color: '#7C3AED', marginBottom: 12, fontSize: 14 }}>
            🏷️ Taux d'accumulation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>{t('pointsPerDh')}</span>
            <input type="number" min="0.1" step="0.1" value={ptsPerDh}
              onChange={e => setPtsPerDh(e.target.value)}
              style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #DDD6FE', fontSize: 15, fontWeight: 700, textAlign: 'center' }} />
            <span style={{ fontSize: 14, color: '#374151' }}>{t('pointsPerDhUnit')}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#7C3AED', background: '#EDE9FE', borderRadius: 6, padding: '6px 10px' }}>
            Ex: achat de 100 DH → <strong>{Math.round(100 * ptsPerDh)} points</strong> gagnés
          </div>
        </div>

        {/* Redemption rate */}
        <div style={{ marginBottom: 28, padding: 18, background: '#E1F5EE', borderRadius: 10, border: '1.5px solid #A7F3D0' }}>
          <div style={{ fontWeight: 700, color: '#085041', marginBottom: 12, fontSize: 14 }}>
            💳 Taux d'utilisation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>{t('pointsForDh')}</span>
            <input type="number" min="1" step="1" value={ptsForDh}
              onChange={e => setPtsForDh(e.target.value)}
              style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #A7F3D0', fontSize: 15, fontWeight: 700, textAlign: 'center' }} />
            <span style={{ fontSize: 14, color: '#374151' }}>{t('pointsForDhUnit')}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#085041', background: '#CCFBF1', borderRadius: 6, padding: '6px 10px' }}>
            Ex: 100 pts → <strong>{formatMoney(100 / ptsForDh)} DH</strong> de réduction
          </div>
        </div>

        {/* Summary table */}
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>Résumé</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ color: '#6B7280' }}>Achat de 1 DH donne</span>
            <strong>{ptsPerDh} pt(s)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ color: '#6B7280' }}>1 DH de réduction coûte</span>
            <strong>{ptsForDh} pts</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ color: '#6B7280' }}>Rentabilité points</span>
            <strong style={{ color: '#1D9E75' }}>{formatMoney(ptsPerDh / ptsForDh * 100)}% de retour</strong>
          </div>
        </div>

        <button onClick={handleSave} style={{
          width: '100%', padding: '12px 0', background: '#1D9E75', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          💾 {t('save')} les paramètres
        </button>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inp = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 14 }

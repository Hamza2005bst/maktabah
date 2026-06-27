import { useState, useMemo, useEffect, useRef } from 'react'
import { COLORS, formatMoney, uid } from '../constants.js'

export default function POS(props) {
  const { t, currentUser, categories, products, cities, schools, lists, listItems, addSale, loyaltyCards, loyaltySetting, addLoyaltyCard } = props
  const [active, setActive] = useState(false)
  const [cart, setCart] = useState([])
  const [clientName, setClientName] = useState('')
  const [clientNameError, setClientNameError] = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const isPremium = currentUser?.plan === 'premium'

  // Loyalty state
  const [showLoyalty, setShowLoyalty] = useState(false)
  const [loyaltySearch, setLoyaltySearch] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [ptsToRedeem, setPtsToRedeem] = useState(0)
  const [scanToast, setScanToast] = useState(null) // { type: 'success'|'error', text }
  const scanBuffer = useRef('')
  const scanLastTime = useRef(0)
  const productsRef = useRef(products)
  useEffect(() => { productsRef.current = products }, [products])

  const setting = loyaltySetting || { pointsPerDh: 1, pointsForDh: 25 }
  const discountDh = selectedCard ? Math.floor(ptsToRedeem / setting.pointsForDh) : 0

  const startSale = () => {
    setActive(true); setCart([]); setClientName(''); setClientNameError(false)
    setSelectedCard(null); setPtsToRedeem(0); setShowLoyalty(false); setLoyaltySearch('')
  }

  const cancelSale = () => {
    setActive(false); setCart([]); setClientName(''); setClientNameError(false)
    setSelectedCard(null); setPtsToRedeem(0); setShowLoyalty(false)
    setScanToast(null); scanBuffer.current = ''
  }

  const showToast = (type, text) => {
    setScanToast({ type, text })
    setTimeout(() => setScanToast(null), 2000)
  }

  useEffect(() => {
    if (!active) return
    const decodeAscii = (raw) => {
      if (raw.length % 3 !== 0 || raw.length < 9) return null
      let decoded = ''
      for (let i = 0; i < raw.length; i += 3) {
        const n = parseInt(raw.substring(i, i + 3), 10)
        if (n < 32 || n > 126) return null
        decoded += String.fromCharCode(n)
      }
      return decoded
    }
    const findProduct = (code) => {
      return productsRef.current.find(p => p.barcode && p.barcode.trim() === code)
    }
    const handleKey = (e) => {
      if (e.key === 'Enter') {
        const raw = scanBuffer.current.trim()
        scanBuffer.current = ''
        scanLastTime.current = 0
        if (raw.length < 4) return
        let found = findProduct(raw)
        if (!found) {
          const decoded = decodeAscii(raw)
          if (decoded) found = findProduct(decoded)
        }
        if (found) {
          addToCart(found)
          showToast('success', found.name)
        } else {
          showToast('error', raw)
        }
        return
      }
      const now = Date.now()
      if (now - scanLastTime.current > 100) scanBuffer.current = ''
      scanLastTime.current = now
      if (e.key.length === 1) scanBuffer.current += e.key
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [active])

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      if (found) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      return updated.filter(i => i.quantity > 0)
    })
  }

  const loadList = (listId) => {
    const items = listItems.filter(li => li.listId === listId)
    items.forEach(li => {
      const product = products.find(p => p.id === li.productId)
      if (!product) return
      setCart(prev => {
        const found = prev.find(i => i.id === product.id)
        if (found) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + li.quantity } : i)
        return [...prev, { ...product, quantity: li.quantity }]
      })
    })
    setShowLists(false)
  }

  const validateSale = () => {
    if (cart.length === 0) return
    if (!clientName.trim() && !selectedCard) { setClientNameError(true); return }
    const rawTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const finalTotal = Math.max(0, rawTotal - discountDh)
    const pointsEarned = Math.floor(finalTotal * setting.pointsPerDh)
    addSale(clientName.trim() || (selectedCard?.name ?? ''), cart, {
      cardId: selectedCard?.id || null,
      discountDh,
      pointsRedeemed: ptsToRedeem,
      pointsEarned,
    })
    const now = new Date()
    setTicketData({
      storeName: currentUser?.storeName || 'Maktabah',
      clientName: clientName.trim() || selectedCard?.name || '',
      cart: [...cart],
      rawTotal,
      discountDh,
      ptsToRedeem,
      total: finalTotal,
      date: now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    })
    setActive(false); setCart([]); setClientName(''); setClientNameError(false)
    setSelectedCard(null); setPtsToRedeem(0); setShowLoyalty(false)
  }

  const rawTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = Math.max(0, rawTotal - discountDh)
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  // Create a new loyalty card from POS and immediately select it
  const handleCreateCard = ({ name, phone }) => {
    const newId = uid()
    addLoyaltyCard({ id: newId, name, phone })
    setSelectedCard({ id: newId, name, phone: phone || '', points: 0 })
    setPtsToRedeem(0)
    setLoyaltySearch('')
  }

  // Loyalty card search results
  const loyaltyResults = useMemo(() => {
    if (!loyaltySearch.trim()) return []
    const q = loyaltySearch.toLowerCase()
    return (loyaltyCards || []).filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 5)
  }, [loyaltyCards, loyaltySearch])

  if (!active) {
    return (
      <>
        <div style={{
          minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20,
        }}>
          <div style={{ fontSize: 64 }}>🛒</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1D2433' }}>{t('posTitle')}</div>
          <div style={{ fontSize: 15, color: '#6B7280' }}>{t('posSubtitle')}</div>
          <button onClick={startSale} style={{
            marginTop: 8, padding: '14px 48px', background: '#1D9E75', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
          }}>
            {t('newSale')}
          </button>
        </div>
        {ticketData && <PrintTicketModal data={ticketData} onClose={() => setTicketData(null)} />}
      </>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {scanToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, padding: '12px 24px', borderRadius: 12,
          background: scanToast.type === 'success' ? '#065F46' : '#991B1B',
          color: '#fff', fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
        }}>
          {scanToast.type === 'success' ? '✓' : '⚠'} {scanToast.type === 'success' ? `Ajouté : ${scanToast.text}` : `Code introuvable : ${scanToast.text}`}
        </div>
      )}
      {/* Products panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 16px 20px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: clientNameError ? 4 : 8, alignItems: 'center' }}>
          <input
            value={clientName}
            onChange={e => { setClientName(e.target.value); if (e.target.value.trim()) setClientNameError(false) }}
            placeholder={t('clientName')}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: 8,
              border: `1.5px solid ${clientNameError ? '#E24B4A' : '#E5E7EB'}`,
              fontSize: 14, outline: 'none',
              background: clientNameError ? '#FFF5F5' : '#fff',
            }}
          />
          {/* Loyalty button */}
          <button onClick={() => setShowLoyalty(l => !l)} style={{
            padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: selectedCard ? '#F5F3FF' : showLoyalty ? '#EDE9FE' : '#F3F4F6',
            color: selectedCard ? '#7C3AED' : '#374151',
            border: selectedCard ? '1.5px solid #DDD6FE' : '1.5px solid transparent',
          }}>
            ⭐ {selectedCard ? `${selectedCard.points} pts` : t('loyalty')}
          </button>
          {isPremium && (
            <button onClick={() => setShowLists(true)} style={{
              padding: '9px 16px', background: '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              📋 {t('lists')}
            </button>
          )}
          <button onClick={cancelSale} style={{
            padding: '9px 16px', background: '#FCEBEB', color: '#E24B4A',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            ✕ {t('cancel')}
          </button>
        </div>

        {/* Client name error */}
        {clientNameError && (
          <div style={{ color: '#E24B4A', fontSize: 12, fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>
            ⚠ {t('clientNameRequired')}
          </div>
        )}

        {/* Loyalty panel */}
        {showLoyalty && (
          <LoyaltyPanel
            loyaltyCards={loyaltyCards} loyaltySetting={setting}
            loyaltySearch={loyaltySearch} setLoyaltySearch={setLoyaltySearch}
            loyaltyResults={loyaltyResults}
            selectedCard={selectedCard} setSelectedCard={(c) => { setSelectedCard(c); setPtsToRedeem(0); setLoyaltySearch(''); setClientNameError(false) }}
            ptsToRedeem={ptsToRedeem} setPtsToRedeem={setPtsToRedeem}
            rawTotal={rawTotal} discountDh={discountDh}
            onCreateCard={handleCreateCard}
            t={t}
          />
        )}

        <ProductBrowser
          categories={categories} products={products} cart={cart}
          addToCart={addToCart} t={t}
        />
      </div>

      {/* Cart */}
      <div style={{
        width: 300, background: '#fff', borderLeft: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{t('cart')} {totalItems > 0 && <span style={{ background: '#1D9E75', color: '#fff', borderRadius: '50%', padding: '1px 7px', fontSize: 12 }}>{totalItems}</span>}</div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} style={{ fontSize: 12, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer' }}>
              {t('clearCart')}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 }}>{t('emptyCart')}</div>
          ) : (
            cart.map(item => {
              const cat = { colorIndex: 0 }
              const color = COLORS[item.colorIndex ?? cat.colorIndex ?? 0]
              return (
                <div key={item.id} style={{
                  background: color.light, borderRadius: 8, padding: '8px 10px', marginBottom: 8,
                  borderLeft: `3px solid ${color.hex}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2433', marginBottom: 6 }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={qtyBtn}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={qtyBtn}>+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: color.hex }}>
                      {formatMoney(item.price * item.quantity)} DH
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Total + validate */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
          {discountDh > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                <span>Sous-total</span>
                <span>{formatMoney(rawTotal)} DH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>
                <span>⭐ Réduction fidélité ({ptsToRedeem} pts)</span>
                <span>−{formatMoney(discountDh)} DH</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 18, fontWeight: 800 }}>
            <span>{t('total')}</span>
            <span style={{ color: '#1D9E75' }}>{formatMoney(total)} DH</span>
          </div>
          {selectedCard && cart.length > 0 && (
            <div style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', borderRadius: 6, padding: '5px 10px', marginBottom: 8, textAlign: 'center' }}>
              +{Math.floor(total * setting.pointsPerDh)} pts gagnés après cette vente
            </div>
          )}
          <button onClick={validateSale} disabled={cart.length === 0} style={{
            width: '100%', padding: '12px 0',
            background: cart.length === 0 ? '#E5E7EB' : 'linear-gradient(135deg, #1D9E75, #16a364)',
            color: cart.length === 0 ? '#9CA3AF' : '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
          }}>
            ✓ {t('validate')}
          </button>
        </div>
      </div>

      {/* Lists modal (Premium) */}
      {showLists && (
        <ListsModal
          cities={cities} schools={schools} lists={lists} listItems={listItems} products={products}
          onLoad={loadList} onClose={() => setShowLists(false)} t={t}
        />
      )}

    </div>
  )
}

function LoyaltyPanel({ loyaltyCards, loyaltySetting, loyaltySearch, setLoyaltySearch, loyaltyResults, selectedCard, setSelectedCard, ptsToRedeem, setPtsToRedeem, rawTotal, discountDh, onCreateCard, t }) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const maxPtsUsable = selectedCard ? Math.min(selectedCard.points, rawTotal * loyaltySetting.pointsForDh) : 0
  const maxDhDiscount = Math.floor(maxPtsUsable / loyaltySetting.pointsForDh)

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateCard({ name: newName.trim(), phone: newPhone.trim() })
    setCreating(false); setNewName(''); setNewPhone('')
  }

  return (
    <div style={{
      background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 10,
      padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#7C3AED', marginBottom: 10 }}>⭐ {t('loyalty')}</div>

      {!selectedCard ? (
        <div>
          {!creating ? (
            <>
              <input
                autoFocus
                value={loyaltySearch} onChange={e => { setLoyaltySearch(e.target.value); setCreating(false) }}
                placeholder="Rechercher par nom ou téléphone..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #DDD6FE', fontSize: 13, background: '#fff' }}
              />
              {loyaltyResults.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #DDD6FE', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                  {loyaltyResults.map(card => (
                    <div key={card.id} onClick={() => setSelectedCard(card)} style={{
                      padding: '9px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: '1px solid #F3F4F6',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{card.name}</div>
                        {card.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{card.phone}</div>}
                      </div>
                      <div style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                        {card.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* No results: show create button */}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {loyaltySearch.trim() && loyaltyResults.length === 0 && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Aucun résultat</span>
                )}
                <button onClick={() => { setCreating(true); setNewName(loyaltySearch.trim()); setNewPhone('') }} style={{
                  marginLeft: 'auto', padding: '5px 14px', background: '#7C3AED', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  + Nouveau client
                </button>
              </div>
            </>
          ) : (
            /* Creation form */
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1.5px solid #DDD6FE' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#7C3AED', marginBottom: 8 }}>Créer une carte fidélité</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Nom du client *"
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1.5px solid #DDD6FE', fontSize: 13 }}
                />
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Téléphone"
                  style={{ width: 120, padding: '7px 10px', borderRadius: 7, border: '1.5px solid #DDD6FE', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreate} disabled={!newName.trim()} style={{
                  flex: 1, padding: '7px 0', background: newName.trim() ? '#7C3AED' : '#E5E7EB',
                  color: newName.trim() ? '#fff' : '#9CA3AF',
                  border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed',
                }}>
                  ✓ Créer et lier
                </button>
                <button onClick={() => { setCreating(false); setNewName(''); setNewPhone('') }}
                  style={{ padding: '7px 12px', background: '#F3F4F6', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Selected card info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedCard.name}</div>
              <div style={{ fontSize: 12, color: '#7C3AED' }}>
                {selectedCard.points} pts disponibles → {formatMoney(selectedCard.points / loyaltySetting.pointsForDh)} DH max
              </div>
            </div>
            <button onClick={() => setSelectedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>×</button>
          </div>

          {/* Points redemption slider */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #DDD6FE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#6B7280' }}>Points à utiliser</span>
              <span style={{ fontWeight: 700, color: '#7C3AED' }}>{ptsToRedeem} pts → <span style={{ color: '#1D9E75' }}>−{discountDh} DH</span></span>
            </div>
            <input type="range" min={0} max={maxPtsUsable} step={loyaltySetting.pointsForDh}
              value={ptsToRedeem} onChange={e => setPtsToRedeem(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#7C3AED', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
              <span>0 DH</span>
              <span>max {maxDhDiscount} DH</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => setPtsToRedeem(0)} style={{ flex: 1, padding: '5px 0', fontSize: 11, background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Aucun</button>
              <button onClick={() => setPtsToRedeem(Math.floor(maxPtsUsable / 2 / loyaltySetting.pointsForDh) * loyaltySetting.pointsForDh)}
                style={{ flex: 1, padding: '5px 0', fontSize: 11, background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>50%</button>
              <button onClick={() => setPtsToRedeem(Math.floor(maxPtsUsable / loyaltySetting.pointsForDh) * loyaltySetting.pointsForDh)}
                style={{ flex: 1, padding: '5px 0', fontSize: 11, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Max</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductBrowser({ categories, products, cart, addToCart, t }) {
  const [activeCat, setActiveCat] = useState(null)

  const filtered = activeCat
    ? products.filter(p => p.categoryId === activeCat)
    : products

  const getCat = (id) => categories.find(c => c.id === id)

  return (
    <div>
      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveCat(null)} style={{
          padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: !activeCat ? '#1D2433' : '#F3F4F6',
          color: !activeCat ? '#fff' : '#374151',
        }}>{t('allCategories')}</button>
        {categories.map((cat, idx) => {
          const color = COLORS[cat.colorIndex ?? idx % 8]
          const isActive = activeCat === cat.id
          return (
            <button key={cat.id} onClick={() => setActiveCat(isActive ? null : cat.id)} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: isActive ? color.hex : color.light,
              color: isActive ? '#fff' : color.hex,
              transition: 'all 0.15s',
            }}>{cat.name}</button>
          )
        })}
      </div>

      {/* Product list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>{t('noProducts')}</div>
        ) : (
          filtered.map((product, idx) => {
            const cat = getCat(product.categoryId) || {}
            const color = COLORS[cat.colorIndex ?? 0]
            const inCart = cart.find(i => i.id === product.id)
            return (
              <div key={product.id} onClick={() => addToCart(product)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 16px', borderRadius: 8, cursor: 'pointer',
                background: `linear-gradient(90deg, ${color.light} 0%, rgba(255,255,255,0.4) 100%)`,
                border: `1px solid ${inCart ? color.hex : 'transparent'}`,
                transition: 'all 0.12s',
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1D2433' }}>{product.name}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {inCart && <span style={{ fontSize: 11, background: color.mid, color: color.hex, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>×{inCart.quantity}</span>}
                  <div style={{ fontSize: 15, fontWeight: 700, color: color.hex }}>{formatMoney(product.price)} DH</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ListsModal({ cities, schools, lists, listItems, products, onLoad, onClose, t }) {
  const [level, setLevel] = useState('cities') // 'cities' | 'schools' | 'lists'
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)

  const schoolsInCity = schools.filter(s => s.cityId === selectedCity?.id)
  const listsInSchool = lists.filter(l => l.schoolId === selectedSchool?.id)

  const getListTotal = (listId) => {
    const items = listItems.filter(li => li.listId === listId)
    return items.reduce((s, li) => {
      const p = products.find(p => p.id === li.productId)
      return s + (p ? p.price * li.quantity : 0)
    }, 0)
  }

  const getListPreview = (listId) => {
    return listItems.filter(li => li.listId === listId).slice(0, 3).map(li => {
      const p = products.find(p => p.id === li.productId)
      return p ? `${li.quantity}× ${p.name}` : null
    }).filter(Boolean)
  }

  const citiesWithSchools = cities.filter(c => schools.some(s => s.cityId === c.id && lists.some(l => l.schoolId === s.id)))

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {level === 'cities' ? t('cities') : level === 'schools' ? t('schools') : t('listsTitle')}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {level !== 'cities' && (
              <button onClick={() => level === 'lists' ? setLevel('schools') : setLevel('cities')} style={{
                fontSize: 13, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>← {t('backTo')}</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {level === 'cities' && citiesWithSchools.map(city => {
            const schoolCount = schools.filter(s => s.cityId === city.id).length
            const color = COLORS[cities.indexOf(city) % 8]
            return (
              <div key={city.id} onClick={() => { setSelectedCity(city); setLevel('schools') }} style={{
                background: color.light, border: `2px solid ${color.mid}`, borderRadius: 10,
                padding: '16px 14px', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1D2433' }}>{city.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{schoolCount} {t('schools')}</div>
              </div>
            )
          })}
          {level === 'schools' && schoolsInCity.map(school => {
            const listCount = lists.filter(l => l.schoolId === school.id).length
            const color = COLORS[schoolsInCity.indexOf(school) % 8]
            return (
              <div key={school.id} onClick={() => { setSelectedSchool(school); setLevel('lists') }} style={{
                background: color.light, border: `2px solid ${color.mid}`, borderRadius: 10,
                padding: '16px 14px', cursor: 'pointer',
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1D2433' }}>{school.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{listCount} {t('lists')}</div>
              </div>
            )
          })}
          {level === 'lists' && listsInSchool.map(list => {
            const preview = getListPreview(list.id)
            const total = getListTotal(list.id)
            const color = COLORS[listsInSchool.indexOf(list) % 8]
            return (
              <div key={list.id} style={{ background: color.light, border: `2px solid ${color.mid}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{list.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
                  {preview.map((p, i) => <div key={i}>{p}</div>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: color.hex }}>{formatMoney(total)} DH</span>
                  <button onClick={() => onLoad(list.id)} style={{
                    background: color.hex, color: '#fff', border: 'none', borderRadius: 6,
                    padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{t('loadList')}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PrintTicketModal({ data, onClose }) {
  const { storeName, clientName, cart, rawTotal, discountDh, ptsToRedeem, total, date, time } = data

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=420,height=700,scrollbars=yes')
    const lines = cart.map(item => {
      const lineTotal = formatMoney(item.price * item.quantity)
      const name = item.name
      const qtyPrice = `${item.quantity} x ${formatMoney(item.price)}`
      return `
        <tr>
          <td style="padding:3px 0; font-size:12px; font-weight:700; word-break:break-all;">${name}</td>
          <td style="padding:3px 0; font-size:11px; font-weight:700; text-align:center; white-space:nowrap;">${qtyPrice}</td>
          <td style="padding:3px 0; font-size:12px; font-weight:700; text-align:right; white-space:nowrap;">${lineTotal} DH</td>
        </tr>`
    }).join('')

    const discountRow = discountDh > 0 ? `
      <tr><td colspan="3"><hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/></td></tr>
      <tr>
        <td colspan="2" style="font-size:12px;font-weight:700;padding:2px 0;">Sous-total</td>
        <td style="font-size:12px;font-weight:700;text-align:right;padding:2px 0;">${formatMoney(rawTotal)} DH</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size:12px;font-weight:700;padding:2px 0;">Réduction (${ptsToRedeem} pts)</td>
        <td style="font-size:12px;font-weight:700;text-align:right;padding:2px 0;">-${formatMoney(discountDh)} DH</td>
      </tr>` : ''

    w.document.write(`<!DOCTYPE html><html><head><title>Ticket</title>
      <style>
        @page { size: 72mm auto; margin: 0; }
        * { color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: 700 !important; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 2mm 3mm 2mm 2mm; width: 72mm; font-size: 12px; font-weight: 700; line-height: 1.4; box-sizing: border-box; }
        @media print { body { padding: 2mm 3mm 2mm 2mm; width: 72mm; } }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .header { text-align: center; margin-bottom: 8px; }
        .sep { border: none; border-top: 2px dashed #000; margin: 6px 0; }
        .sep-thin { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        .total-row td { font-size: 15px; font-weight: 700; padding-top: 6px; }
        .thanks { text-align: center; font-size: 12px; margin-top: 10px; font-weight: 700; }
        td, th { overflow: visible; }
      </style>
    </head><body>
      <div class="header">
        <div style="font-size:15px;font-weight:700;letter-spacing:1px;">${storeName}</div>
        <div style="font-size:11px;margin-top:4px;font-weight:700;">${date} | ${time}</div>
        ${clientName ? `<div style="font-size:12px;margin-top:4px;"><strong>Client :</strong> ${clientName}</div>` : ''}
      </div>
      <hr class="sep"/>
      <table>
        <colgroup><col style="width:42%"/><col style="width:26%"/><col style="width:32%"/></colgroup>
        <thead>
          <tr style="font-size:11px;font-weight:700;">
            <th style="text-align:left;padding-bottom:4px;">Produit</th>
            <th style="text-align:center;padding-bottom:4px;">Qté × Prix</th>
            <th style="text-align:right;padding-bottom:4px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lines}
        </tbody>
      </table>
      ${discountRow}
      <hr class="sep"/>
      <table>
        <tr class="total-row">
          <td>TOTAL</td>
          <td style="text-align:right;">${formatMoney(total)} DH</td>
        </tr>
      </table>
      <hr class="sep"/>
      <div class="thanks">Merci de votre visite !</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 250)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 400, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>🧾 Ticket de caisse</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
        </div>

        {/* Ticket preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', fontFamily: "'Courier New', monospace" }}>
          {/* Store name */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1 }}>{storeName}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{date} &nbsp;|&nbsp; {time}</div>
            {clientName && <div style={{ fontSize: 12, marginTop: 4 }}><strong>Client :</strong> {clientName}</div>}
          </div>

          <div style={{ borderTop: '2px dashed #bbb', margin: '10px 0' }} />

          {/* Column headers */}
          <div style={{ display: 'flex', fontSize: 10, color: '#999', fontWeight: 700, marginBottom: 6, gap: 4 }}>
            <span style={{ flex: 1 }}>PRODUIT</span>
            <span style={{ width: 110, textAlign: 'center' }}>QTÉ × PRIX</span>
            <span style={{ width: 70, textAlign: 'right' }}>TOTAL</span>
          </div>

          {/* Cart items */}
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', fontSize: 13, marginBottom: 5, gap: 4, alignItems: 'baseline' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              <span style={{ width: 110, textAlign: 'center', color: '#555', fontSize: 11 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1D2433' }}>×{item.quantity}</span>
                {' '}{formatMoney(item.price)} DH
              </span>
              <span style={{ width: 70, textAlign: 'right', fontWeight: 700 }}>{formatMoney(item.price * item.quantity)} DH</span>
            </div>
          ))}

          <div style={{ borderTop: '2px dashed #bbb', margin: '10px 0' }} />

          {/* Subtotal + discount */}
          {discountDh > 0 && (
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: 2 }}>
                <span>Sous-total</span>
                <span>{formatMoney(rawTotal)} DH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7C3AED', fontWeight: 600 }}>
                <span>⭐ Réduction ({ptsToRedeem} pts)</span>
                <span>−{formatMoney(discountDh)} DH</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, marginTop: 6 }}>
            <span>TOTAL</span>
            <span style={{ color: '#1D9E75' }}>{formatMoney(total)} DH</span>
          </div>

          <div style={{ borderTop: '2px dashed #bbb', margin: '10px 0' }} />
          <div style={{ textAlign: 'center', fontSize: 11, color: '#888' }}>Merci de votre visite ! ✦ شكراً لزيارتكم</div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={{
            flex: 1, padding: '11px 0', background: 'linear-gradient(135deg, #1D9E75, #16a364)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            🖨️ Imprimer
          </button>
          <button onClick={onClose} style={{
            padding: '11px 20px', background: '#F3F4F6', color: '#374151',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

const qtyBtn = {
  width: 26, height: 26, borderRadius: 6, border: '1.5px solid #D1D5DB',
  background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

import { useState } from 'react'
import { COLORS, formatMoney, uid, GRADE_TEMPLATES } from '../constants.js'

export default function Lists({ t, currentUser, categories, products, cities, schools, lists, listItems,
  addCity, deleteCity, addSchool, deleteSchool, addList, updateList, deleteList }) {

  const [level, setLevel] = useState('cities')       // 'cities' | 'schools' | 'lists' | 'editor'
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [editingList, setEditingList] = useState(null) // { list|null, gradeName }

  // Inline add forms
  const [newCityName, setNewCityName] = useState('')
  const [showCityForm, setShowCityForm] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [showSchoolForm, setShowSchoolForm] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customListName, setCustomListName] = useState('')

  const goToCity = (city) => { setSelectedCity(city); setLevel('schools') }
  const goToSchool = (school) => { setSelectedSchool(school); setLevel('lists') }
  const goBack = () => {
    if (level === 'editor') { setLevel('lists'); setEditingList(null) }
    else if (level === 'lists') { setLevel('schools'); setSelectedSchool(null) }
    else if (level === 'schools') { setLevel('cities'); setSelectedCity(null) }
  }

  const openEditor = (gradeName) => {
    const existing = lists.find(l => l.schoolId === selectedSchool.id && l.name === gradeName)
    setEditingList({ list: existing || null, gradeName })
    setLevel('editor')
  }

  const handleAddCity = () => {
    if (!newCityName.trim()) return
    addCity(newCityName.trim())
    setNewCityName(''); setShowCityForm(false)
  }

  const handleAddSchool = () => {
    if (!newSchoolName.trim()) return
    addSchool(newSchoolName.trim(), selectedCity.id)
    setNewSchoolName(''); setShowSchoolForm(false)
  }

  const handleAddCustomList = () => {
    if (!customListName.trim()) return
    openEditor(customListName.trim())
    setCustomListName(''); setShowCustomForm(false)
  }

  const getListForGrade = (gradeName) =>
    lists.find(l => l.schoolId === selectedSchool?.id && l.name === gradeName)

  const getListTotal = (listId) =>
    listItems.filter(li => li.listId === listId).reduce((s, li) => {
      const p = products.find(p => p.id === li.productId)
      return s + (p ? p.price * li.quantity : 0)
    }, 0)

  const getListItems = (listId) => listItems.filter(li => li.listId === listId)


  // ---- EDITOR ----
  if (level === 'editor' && editingList) {
    return (
      <ListEditor
        gradeName={editingList.gradeName}
        existingList={editingList.list}
        existingItems={editingList.list ? getListItems(editingList.list.id) : []}
        school={selectedSchool}
        categories={categories}
        products={products}
        addList={addList}
        updateList={updateList}
        deleteList={deleteList}
        onBack={goBack}
        t={t}
      />
    )
  }

  // ---- BREADCRUMB ----
  const Breadcrumb = () => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, fontSize: 14 }}>
      <span onClick={() => { setLevel('cities'); setSelectedCity(null); setSelectedSchool(null) }}
        style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 600 }}>🏙 Villes</span>
      {selectedCity && (
        <>
          <span style={{ color: '#D1D5DB' }}>/</span>
          <span onClick={() => { setLevel('schools'); setSelectedSchool(null) }}
            style={{ color: level === 'schools' ? '#374151' : '#1D9E75', cursor: level === 'schools' ? 'default' : 'pointer', fontWeight: 600 }}>
            {selectedCity.name}
          </span>
        </>
      )}
      {selectedSchool && (
        <>
          <span style={{ color: '#D1D5DB' }}>/</span>
          <span style={{ color: '#374151', fontWeight: 600 }}>{selectedSchool.name}</span>
        </>
      )}
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      {level !== 'cities' && <Breadcrumb />}

      {/* ---- CITIES ---- */}
      {level === 'cities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1D2433' }}>🏙 Villes</h2>
            <button onClick={() => setShowCityForm(true)} style={greenBtn}>+ Ajouter une ville</button>
          </div>
          {showCityForm && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', border: '1.5px solid #E5E7EB' }}>
              <input autoFocus value={newCityName} onChange={e => setNewCityName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCity()}
                placeholder="Nom de la ville"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
              <button onClick={handleAddCity} style={greenBtn}>Ajouter</button>
              <button onClick={() => { setShowCityForm(false); setNewCityName('') }} style={grayBtn}>✕</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {cities.map((city, i) => {
              const color = COLORS[i % 8]
              const schoolCount = schools.filter(s => s.cityId === city.id).length
              return (
                <div key={city.id} style={{ position: 'relative' }}>
                  <div onClick={() => goToCity(city)} style={{
                    background: color.light, border: `2px solid ${color.mid}`, borderRadius: 14,
                    padding: '22px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🏙</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1D2433' }}>{city.name}</div>
                    <div style={{ fontSize: 12, color: color.hex, marginTop: 4, fontWeight: 600 }}>{schoolCount} école(s)</div>
                  </div>
                  <button onClick={() => deleteCity(city.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(226,75,74,0.1)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#E24B4A', fontSize: 13, padding: '2px 6px' }}>🗑</button>
                </div>
              )
            })}
            {cities.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>
                Aucune ville. Commencez par en ajouter une.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- SCHOOLS ---- */}
      {level === 'schools' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1D2433' }}>🏫 Écoles — {selectedCity.name}</h2>
            <button onClick={() => setShowSchoolForm(true)} style={greenBtn}>+ Ajouter une école</button>
          </div>
          {showSchoolForm && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', border: '1.5px solid #E5E7EB' }}>
              <input autoFocus value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSchool()}
                placeholder="Nom de l'école"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
              <button onClick={handleAddSchool} style={greenBtn}>Ajouter</button>
              <button onClick={() => { setShowSchoolForm(false); setNewSchoolName('') }} style={grayBtn}>✕</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {schools.filter(s => s.cityId === selectedCity.id).map((school, i) => {
              const color = COLORS[i % 8]
              const filledCount = lists.filter(l => l.schoolId === school.id && listItems.some(li => li.listId === l.id)).length
              return (
                <div key={school.id} style={{ position: 'relative' }}>
                  <div onClick={() => goToSchool(school)} style={{
                    background: color.light, border: `2px solid ${color.mid}`, borderRadius: 14,
                    padding: '22px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🏫</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1D2433' }}>{school.name}</div>
                    <div style={{ fontSize: 12, color: color.hex, marginTop: 4, fontWeight: 600 }}>
                      {filledCount > 0 ? `${filledCount} liste(s) remplie(s)` : 'Vide'}
                    </div>
                  </div>
                  <button onClick={() => deleteSchool(school.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(226,75,74,0.1)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#E24B4A', fontSize: 13, padding: '2px 6px' }}>🗑</button>
                </div>
              )
            })}
            {schools.filter(s => s.cityId === selectedCity.id).length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>
                Aucune école dans cette ville.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- LISTS ---- */}
      {level === 'lists' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1D2433' }}>📋 {selectedSchool.name}</h2>
            <button onClick={() => setShowCustomForm(true)} style={greenBtn}>+ Créer une liste</button>
          </div>

          {showCustomForm && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', border: '1.5px solid #E5E7EB' }}>
              <input autoFocus value={customListName} onChange={e => setCustomListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustomList()}
                placeholder="Nom de la liste (ex: Classe Bilingue...)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
              <button onClick={handleAddCustomList} style={greenBtn}>Créer</button>
              <button onClick={() => { setShowCustomForm(false); setCustomListName('') }} style={grayBtn}>✕</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              ...GRADE_TEMPLATES,
              ...lists.filter(l => l.schoolId === selectedSchool.id && !GRADE_TEMPLATES.includes(l.name)).map(l => l.name),
            ].map((grade, i) => {
              const storeList = lists.find(l => l.schoolId === selectedSchool.id && l.name === grade)
              const items = storeList ? getListItems(storeList.id) : []
              const total = storeList ? getListTotal(storeList.id) : 0
              const color = COLORS[i % 8]
              return (
                <GradeCard key={grade}
                  name={grade} color={color} items={items} total={total}
                  products={products}
                  onEdit={() => openEditor(grade)}
                  onDelete={storeList ? () => deleteList(storeList.id) : null}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GradeCard({ name, color, items, total, products, onEdit, onDelete }) {
  const filled = items.length > 0
  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `2px solid ${filled ? color.hex : color.mid}`,
      boxShadow: filled ? `0 2px 12px ${color.hex}22` : '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ background: filled ? color.hex : color.light, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: filled ? '#fff' : color.hex }}>{name}</span>
        {onDelete && <button onClick={onDelete} style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 5, cursor: 'pointer', color: filled ? '#fff' : color.hex, fontSize: 11, padding: '1px 5px' }}>🗑</button>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {filled ? (
          <>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
              {items.slice(0, 3).map((li, j) => {
                const p = products.find(p => p.id === li.productId)
                return p ? <div key={j} style={{ marginBottom: 2 }}>• {li.quantity}× {p.name}</div> : null
              })}
              {items.length > 3 && <div style={{ color: '#9CA3AF' }}>+{items.length - 3} autres</div>}
            </div>
            <div style={{ fontWeight: 700, color: color.hex, fontSize: 14, marginBottom: 10 }}>{formatMoney(total)} DH</div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontStyle: 'italic' }}>Liste vide</div>
        )}
        <button onClick={onEdit} style={{
          width: '100%', padding: '7px 0', border: `1.5px solid ${color.hex}`,
          borderRadius: 8, background: filled ? color.light : 'transparent',
          color: color.hex, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          {filled ? '✏️ Modifier' : '+ Remplir'}
        </button>
      </div>
    </div>
  )
}

function ListEditor({ gradeName, existingList, existingItems, school, categories, products, addList, updateList, deleteList, onBack, t }) {
  const [selected, setSelected] = useState(() => {
    const map = {}
    existingItems.forEach(li => { map[li.productId] = li.quantity })
    return map
  })
  const [activeCat, setActiveCat] = useState(null)

  const filteredProducts = activeCat ? products.filter(p => p.categoryId === activeCat) : products
  const getCat = (id) => categories?.find(c => c.id === id)

  const addProduct = (product) => {
    setSelected(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))
  }
  const updateQty = (productId, delta) => {
    setSelected(prev => {
      const next = { ...prev, [productId]: (prev[productId] || 0) + delta }
      if (next[productId] <= 0) delete next[productId]
      return { ...next }
    })
  }

  const selectedCount = Object.values(selected).reduce((s, q) => s + q, 0)
  const selectedTotal = Object.entries(selected).reduce((s, [id, q]) => {
    const p = products.find(p => p.id === id)
    return s + (p ? p.price * q : 0)
  }, 0)

  const handleSave = () => {
    const validLines = Object.entries(selected)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))
    const formData = { name: gradeName, schoolId: school.id }
    if (existingList) updateList(existingList.id, formData, validLines)
    else addList(formData, validLines)
    onBack()
  }

  const handleDelete = () => {
    if (existingList) deleteList(existingList.id)
    onBack()
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ← Retour
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1D2433' }}>{gradeName}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>🏫 {school.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {existingList && (
            <button onClick={handleDelete} style={{ padding: '8px 16px', background: '#FCEBEB', color: '#E24B4A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🗑 Supprimer
            </button>
          )}
          <button onClick={handleSave} style={{ padding: '8px 22px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            💾 Enregistrer
          </button>
        </div>
      </div>

      {/* Product picker — POS style */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB' }}>
        {/* Left: browser */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveCat(null)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: !activeCat ? '#1D2433' : '#F3F4F6', color: !activeCat ? '#fff' : '#374151',
            }}>Tout</button>
            {(categories || []).map(cat => {
              const color = COLORS[cat.colorIndex ?? 0]
              const isActive = activeCat === cat.id
              return (
                <button key={cat.id} onClick={() => setActiveCat(isActive ? null : cat.id)} style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: isActive ? color.hex : color.light,
                  color: isActive ? '#fff' : color.hex, transition: 'all 0.12s',
                }}>{cat.name}</button>
              )
            })}
          </div>

          {/* Product rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filteredProducts.length === 0
              ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 13 }}>Aucun produit</div>
              : filteredProducts.map(product => {
                  const cat = getCat(product.categoryId) || {}
                  const color = COLORS[cat.colorIndex ?? 0]
                  const qty = selected[product.id] || 0
                  return (
                    <div key={product.id} onClick={() => addProduct(product)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 14px', borderRadius: 7, cursor: 'pointer',
                      background: qty > 0 ? color.light : `linear-gradient(90deg, ${color.light} 0%, rgba(255,255,255,0.5) 100%)`,
                      border: `1.5px solid ${qty > 0 ? color.hex : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1D2433' }}>{product.name}</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {qty > 0 && <span style={{ background: color.hex, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>×{qty}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: color.hex }}>{product.price} DH</span>
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Right: selection */}
        <div style={{ width: 260, borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FAFAFA' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              Sélection
              {selectedCount > 0 && <span style={{ marginLeft: 6, background: '#1D9E75', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: 11 }}>{selectedCount}</span>}
            </span>
            {selectedCount > 0 && <button onClick={() => setSelected({})} style={{ fontSize: 11, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer' }}>Vider</button>}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
            {selectedCount === 0
              ? <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 32, fontSize: 12 }}>Cliquer sur un produit</div>
              : Object.entries(selected).map(([productId, qty]) => {
                  const product = products.find(p => p.id === productId)
                  if (!product) return null
                  const cat = getCat(product.categoryId) || {}
                  const color = COLORS[cat.colorIndex ?? 0]
                  return (
                    <div key={productId} style={{ background: color.light, borderRadius: 7, padding: '7px 9px', marginBottom: 6, borderLeft: `3px solid ${color.hex}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#1D2433' }}>{product.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateQty(productId, -1)} style={qBtn}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => updateQty(productId, 1)} style={qBtn}>+</button>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: color.hex }}>{formatMoney(product.price * qty)} DH</span>
                      </div>
                    </div>
                  )
                })}
          </div>
          {selectedCount > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', fontSize: 14, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span>
              <span style={{ color: '#1D9E75' }}>{formatMoney(selectedTotal)} DH</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const greenBtn = { padding: '8px 18px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const grayBtn = { padding: '8px 12px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }
const qBtn = { width: 22, height: 22, borderRadius: 5, border: '1.5px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }

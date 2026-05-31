import { useState } from 'react'
import { COLORS, uid, formatMoney, GRADE_TEMPLATES } from '../constants.js'

export default function AdminLists({ adminCities, adminSchools, adminLists, adminListItems,
  addAdminCity, deleteAdminCity, addAdminSchool, deleteAdminSchool,
  saveAdminList, deleteAdminList }) {

  const [level, setLevel] = useState('cities')
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [editingGrade, setEditingGrade] = useState(null) // { gradeName, existingList }

  const [newCityName, setNewCityName] = useState('')
  const [showCityForm, setShowCityForm] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [showSchoolForm, setShowSchoolForm] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customGradeName, setCustomGradeName] = useState('')

  const getList = (gradeName) =>
    adminLists.find(l => l.schoolId === selectedSchool?.id && l.name === gradeName)
  const getItems = (listId) => adminListItems.filter(li => li.listId === listId)
  const getTotal = (listId) => getItems(listId).reduce((s, li) => s + li.unitPrice * li.quantity, 0)

  const openEditor = (gradeName) => {
    setEditingGrade({ gradeName, existingList: getList(gradeName) || null })
    setLevel('editor')
  }

  const handleSave = (items) => {
    saveAdminList(editingGrade.existingList?.id || null, selectedSchool.id, editingGrade.gradeName, items)
    setLevel('lists'); setEditingGrade(null)
  }

  const handleDeleteList = () => {
    if (editingGrade.existingList) deleteAdminList(editingGrade.existingList.id)
    setLevel('lists'); setEditingGrade(null)
  }

  const handleAddCity = () => {
    if (!newCityName.trim()) return
    addAdminCity(newCityName.trim()); setNewCityName(''); setShowCityForm(false)
  }
  const handleAddSchool = () => {
    if (!newSchoolName.trim()) return
    addAdminSchool(newSchoolName.trim(), selectedCity.id); setNewSchoolName(''); setShowSchoolForm(false)
  }
  const handleAddCustom = () => {
    if (!customGradeName.trim()) return
    openEditor(customGradeName.trim()); setCustomGradeName(''); setShowCustomForm(false)
  }

  // Breadcrumb
  const Breadcrumb = () => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, fontSize: 14 }}>
      <span onClick={() => { setLevel('cities'); setSelectedCity(null); setSelectedSchool(null) }}
        style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 600 }}>🏙 Villes</span>
      {selectedCity && <>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span onClick={() => { if (level !== 'schools') { setLevel('schools'); setSelectedSchool(null) } }}
          style={{ color: level === 'schools' ? '#374151' : '#1D9E75', cursor: level === 'schools' ? 'default' : 'pointer', fontWeight: 600 }}>
          {selectedCity.name}
        </span>
      </>}
      {selectedSchool && <>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span onClick={() => { if (level === 'editor') { setLevel('lists'); setEditingGrade(null) } }}
          style={{ color: level === 'lists' ? '#374151' : '#1D9E75', cursor: level === 'lists' ? 'default' : 'pointer', fontWeight: 600 }}>
          {selectedSchool.name}
        </span>
      </>}
      {editingGrade && <>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{editingGrade.gradeName}</span>
      </>}
    </div>
  )

  // ---- EDITOR ----
  if (level === 'editor' && editingGrade) {
    return (
      <div>
        <Breadcrumb />
        <ListEditor
          gradeName={editingGrade.gradeName}
          existingItems={editingGrade.existingList ? getItems(editingGrade.existingList.id) : []}
          onSave={handleSave}
          onDelete={editingGrade.existingList ? handleDeleteList : null}
          onBack={() => { setLevel('lists'); setEditingGrade(null) }}
        />
      </div>
    )
  }

  // ---- CITIES ----
  if (level === 'cities') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>🏙 Villes</h2>
        <button onClick={() => setShowCityForm(true)} style={greenBtn}>+ Ajouter une ville</button>
      </div>
      {showCityForm && (
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8 }}>
          <input autoFocus value={newCityName} onChange={e => setNewCityName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCity()}
            placeholder="Nom de la ville"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
          <button onClick={handleAddCity} style={greenBtn}>Ajouter</button>
          <button onClick={() => { setShowCityForm(false); setNewCityName('') }} style={grayBtn}>✕</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        {adminCities.map((city, i) => {
          const color = COLORS[i % 8]
          const count = adminSchools.filter(s => s.cityId === city.id).length
          return (
            <div key={city.id} style={{ position: 'relative' }}>
              <div onClick={() => { setSelectedCity(city); setLevel('schools') }} style={{
                background: color.light, border: `2px solid ${color.mid}`, borderRadius: 14,
                padding: '20px 16px', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>🏙</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{city.name}</div>
                <div style={{ fontSize: 12, color: color.hex, marginTop: 4 }}>{count} école(s)</div>
              </div>
              <button onClick={() => deleteAdminCity(city.id)} style={delBtn}>🗑</button>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ---- SCHOOLS ----
  if (level === 'schools') return (
    <div>
      <Breadcrumb />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>🏫 Écoles — {selectedCity.name}</h2>
        <button onClick={() => setShowSchoolForm(true)} style={greenBtn}>+ Ajouter une école</button>
      </div>
      {showSchoolForm && (
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8 }}>
          <input autoFocus value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSchool()}
            placeholder="Nom de l'école"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
          <button onClick={handleAddSchool} style={greenBtn}>Ajouter</button>
          <button onClick={() => { setShowSchoolForm(false); setNewSchoolName('') }} style={grayBtn}>✕</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        {adminSchools.filter(s => s.cityId === selectedCity.id).map((school, i) => {
          const color = COLORS[i % 8]
          const filled = adminLists.filter(l => l.schoolId === school.id && adminListItems.some(li => li.listId === l.id)).length
          return (
            <div key={school.id} style={{ position: 'relative' }}>
              <div onClick={() => { setSelectedSchool(school); setLevel('lists') }} style={{
                background: color.light, border: `2px solid ${color.mid}`, borderRadius: 14,
                padding: '20px 16px', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>🏫</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{school.name}</div>
                <div style={{ fontSize: 12, color: color.hex, marginTop: 4 }}>{filled} liste(s) remplie(s)</div>
              </div>
              <button onClick={() => deleteAdminSchool(school.id)} style={delBtn}>🗑</button>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ---- LISTS ----
  if (level === 'lists') return (
    <div>
      <Breadcrumb />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>📋 {selectedSchool.name}</h2>
        <button onClick={() => setShowCustomForm(true)} style={greenBtn}>+ Créer une liste</button>
      </div>
      {showCustomForm && (
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8 }}>
          <input autoFocus value={customGradeName} onChange={e => setCustomGradeName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
            placeholder="Nom de la liste..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
          <button onClick={handleAddCustom} style={greenBtn}>Créer</button>
          <button onClick={() => { setShowCustomForm(false); setCustomGradeName('') }} style={grayBtn}>✕</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {GRADE_TEMPLATES.map((grade, i) => {
          const list = getList(grade)
          const items = list ? getItems(list.id) : []
          const total = list ? getTotal(list.id) : 0
          const color = COLORS[i % 8]
          return (
            <GradeCard key={grade} name={grade} color={color}
              items={items} total={total}
              onEdit={() => openEditor(grade)}
              onDelete={list ? () => { deleteAdminList(list.id) } : null}
            />
          )
        })}
        {/* custom lists */}
        {adminLists.filter(l => l.schoolId === selectedSchool.id && !GRADE_TEMPLATES.includes(l.name)).map((list, i) => {
          const items = getItems(list.id)
          const color = COLORS[(GRADE_TEMPLATES.length + i) % 8]
          return (
            <GradeCard key={list.id} name={list.name} color={color} custom
              items={items} total={getTotal(list.id)}
              onEdit={() => openEditor(list.name)}
              onDelete={() => deleteAdminList(list.id)}
            />
          )
        })}
      </div>
    </div>
  )

  return null
}

function GradeCard({ name, color, items, total, onEdit, onDelete, custom }) {
  const filled = items.length > 0
  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `2px solid ${filled ? color.hex : color.mid}`,
      boxShadow: filled ? `0 2px 10px ${color.hex}22` : 'none',
    }}>
      <div style={{ background: filled ? color.hex : color.light, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: filled ? '#fff' : color.hex }}>{name}</span>
        {onDelete && <button onClick={onDelete} style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 5, cursor: 'pointer', color: filled ? '#fff' : color.hex, fontSize: 11, padding: '2px 6px' }}>🗑</button>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {filled ? (
          <>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
              {items.slice(0, 3).map((li, j) => <div key={j} style={{ marginBottom: 2 }}>• {li.quantity}× {li.productName}</div>)}
              {items.length > 3 && <div style={{ color: '#9CA3AF' }}>+{items.length - 3} autres</div>}
            </div>
            <div style={{ fontWeight: 700, color: color.hex, fontSize: 14, marginBottom: 10 }}>{formatMoney(total)} DH</div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, fontStyle: 'italic' }}>Liste vide</div>
        )}
        <button onClick={onEdit} style={{
          width: '100%', padding: '7px 0', border: `1.5px solid ${color.hex}`,
          borderRadius: 8, background: filled ? color.light : 'transparent',
          color: color.hex, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>{filled ? '✏️ Modifier' : '+ Remplir'}</button>
      </div>
    </div>
  )
}

function ListEditor({ gradeName, existingItems, onSave, onDelete, onBack }) {
  const [rows, setRows] = useState(() =>
    existingItems.length > 0
      ? existingItems.map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice }))
      : [{ productName: '', quantity: 1, unitPrice: 0 }]
  )

  const addRow = () => setRows(prev => [...prev, { productName: '', quantity: 1, unitPrice: 0 }])
  const updateRow = (i, field, val) => setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: val } : r))
  const removeRow = (i) => setRows(prev => prev.filter((_, j) => j !== i))

  const total = rows.reduce((s, r) => s + (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0), 0)

  const handleSave = () => {
    const valid = rows.filter(r => r.productName.trim() && r.quantity > 0)
    onSave(valid.map(r => ({ productName: r.productName.trim(), quantity: Number(r.quantity), unitPrice: Number(r.unitPrice) || 0 })))
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #E5E7EB' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>✏️ {gradeName}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && <button onClick={onDelete} style={{ padding: '7px 14px', background: '#FCEBEB', color: '#E24B4A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🗑 Supprimer</button>}
          <button onClick={onBack} style={grayBtn}>Annuler</button>
          <button onClick={handleSave} style={greenBtn}>💾 Enregistrer</button>
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: 20 }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 36px', gap: 8, marginBottom: 8 }}>
          <div style={th}>Nom du produit</div>
          <div style={th}>Qté</div>
          <div style={th}>Prix unit.</div>
          <div />
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 36px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={row.productName} onChange={e => updateRow(i, 'productName', e.target.value)}
              placeholder="Ex: Cahier 96 pages"
              style={{ padding: '8px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13 }} />
            <input type="number" min="1" value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)}
              style={{ padding: '8px 8px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13, textAlign: 'center' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <input type="number" min="0" step="0.5" value={row.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                style={{ flex: 1, padding: '8px 6px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13, textAlign: 'center' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>DH</span>
            </div>
            <button onClick={() => removeRow(i)} style={{ width: 32, height: 32, borderRadius: 7, background: '#FCEBEB', border: 'none', cursor: 'pointer', color: '#E24B4A', fontSize: 16 }}>×</button>
          </div>
        ))}
        <button onClick={addRow} style={{ marginTop: 4, padding: '7px 16px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Ajouter un produit
        </button>

        {/* Total */}
        <div style={{ marginTop: 20, borderTop: '1px solid #E5E7EB', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#6B7280' }}>Total estimé :</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1D9E75' }}>{formatMoney(total)} DH</span>
        </div>
      </div>
    </div>
  )
}

const greenBtn = { padding: '8px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const grayBtn = { padding: '8px 12px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }
const delBtn = { position: 'absolute', top: 8, right: 8, background: 'rgba(226,75,74,0.1)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#E24B4A', fontSize: 13, padding: '2px 6px' }
const th = { fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px' }

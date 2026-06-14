import { useState } from 'react'
import { COLORS, uid } from '../constants.js'

export default function Products({ t, categories, products, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct }) {
  const [newCatName, setNewCatName] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({ name: '', price: '', costPrice: '', categoryId: '', barcode: '' })
  const [formErrors, setFormErrors] = useState({})
  const [search, setSearch] = useState('')

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const colorIndex = categories.length % 8
    addCategory(newCatName.trim(), colorIndex)
    setNewCatName('')
    setShowCatForm(false)
  }

  const handleDeleteCat = (cat) => {
    if (!window.confirm(t('deleteCategory'))) return
    deleteCategory(cat.id)
    if (selectedCat === cat.id) setSelectedCat(null)
  }

  const openProductForm = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({ name: product.name, price: product.price, costPrice: product.costPrice || '', categoryId: product.categoryId, barcode: product.barcode || '' })
    } else {
      setEditingProduct(null)
      setProductForm({ name: '', price: '', costPrice: '', categoryId: selectedCat || '', barcode: '' })
    }
    setFormErrors({})
    setShowProductForm(true)
  }

  const validateProduct = () => {
    const e = {}
    if (!productForm.name.trim()) e.name = t('required')
    if (!productForm.price || isNaN(productForm.price) || Number(productForm.price) < 0) e.price = t('required')
    if (!productForm.categoryId) e.categoryId = t('required')
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSaveProduct = () => {
    if (!validateProduct()) return
    const data = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      costPrice: Number(productForm.costPrice) || 0,
      categoryId: productForm.categoryId,
      barcode: productForm.barcode.trim() || null,
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, data)
    } else {
      addProduct(data)
    }
    setShowProductForm(false)
  }

  const handleDeleteProduct = (product) => {
    if (!window.confirm(t('deleteProduct'))) return
    deleteProduct(product.id)
  }

  const q = search.trim().toLowerCase()
  const groupedProducts = categories.map(cat => ({
    cat,
    products: products.filter(p =>
      p.categoryId === cat.id &&
      (!selectedCat || selectedCat === cat.id) &&
      (!q || p.name.toLowerCase().includes(q))
    ),
  })).filter(g => g.products.length > 0)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Categories sidebar */}
      <div style={{ width: 210, background: '#fff', borderRight: '1px solid #E5E7EB', overflow: 'auto', padding: '12px 0' }}>
        <div style={{ padding: '0 12px', marginBottom: 10 }}>
          <button onClick={() => setShowCatForm(true)} style={{
            width: '100%', padding: '8px 0', background: '#1D9E75', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t('addCategory')}</button>
        </div>

        {showCatForm && (
          <div style={{ padding: '0 12px', marginBottom: 10 }}>
            <input
              autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder={t('categoryName')}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #D1D5DB', fontSize: 13, marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleAddCategory} style={{ flex: 1, padding: '6px 0', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('save')}</button>
              <button onClick={() => { setShowCatForm(false); setNewCatName('') }} style={{ padding: '6px 10px', background: '#F3F4F6', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        )}

        {/* All */}
        <div onClick={() => setSelectedCat(null)} style={{
          padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: !selectedCat ? '#E1F5EE' : 'transparent',
          color: !selectedCat ? '#085041' : '#374151',
        }}>
          Tous ({products.length})
        </div>

        {categories.map((cat, idx) => {
          const color = COLORS[cat.colorIndex ?? idx % 8]
          const count = products.filter(p => p.categoryId === cat.id).length
          const isActive = selectedCat === cat.id
          return (
            <div key={cat.id} onClick={() => setSelectedCat(isActive ? null : cat.id)} style={{
              padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 6,
              background: isActive ? color.light : 'transparent',
              borderLeft: isActive ? `3px solid ${color.hex}` : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.hex, flexShrink: 0 }} />
                {editingCat === cat.id ? (
                  <input
                    autoFocus value={cat.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateCategory(cat.id, e.target.value)}
                    onBlur={() => setEditingCat(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingCat(null)}
                    style={{ width: '100%', padding: '2px 6px', fontSize: 13, border: `1.5px solid ${color.hex}`, borderRadius: 4 }}
                  />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1D2433', flex: 1 }}>{cat.name}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{count}</span>
                <button onClick={e => { e.stopPropagation(); setEditingCat(cat.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 2 }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); handleDeleteCat(cat) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 2 }}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Products area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9CA3AF', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                borderRadius: 8, border: '1.5px solid #E5E7EB',
                fontSize: 14, outline: 'none', background: '#fff',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1,
              }}>×</button>
            )}
          </div>
          <button onClick={() => openProductForm()} style={{
            padding: '9px 20px', background: '#1D9E75', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t('addProduct')}</button>
        </div>

        {/* Product form inline */}
        {showProductForm && (
          <div style={{
            background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
              {editingProduct ? t('edit') : t('addProduct')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>{t('productName')}</label>
                <input style={{ ...inp, ...(formErrors.name ? errInp : {}) }}
                  value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
                {formErrors.name && <div style={ferr}>{formErrors.name}</div>}
              </div>
              <div>
                <label style={lbl}>{t('salePrice')}</label>
                <input style={{ ...inp, ...(formErrors.price ? errInp : {}) }}
                  type="number" min="0" step="0.01"
                  value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
                {formErrors.price && <div style={ferr}>{formErrors.price}</div>}
              </div>
              <div>
                <label style={lbl}>{t('category')}</label>
                <select style={{ ...inp, ...(formErrors.categoryId ? errInp : {}) }}
                  value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">—</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.categoryId && <div style={ferr}>{formErrors.categoryId}</div>}
              </div>
              <div>
                <label style={lbl}>{t('costPrice')}</label>
                <input style={inp} type="number" min="0" step="0.01"
                  value={productForm.costPrice} onChange={e => setProductForm(f => ({ ...f, costPrice: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Code-barres <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel — pour pistolet scanner)</span></label>
                <input style={inp} placeholder="Ex: 6111234567890"
                  value={productForm.barcode} onChange={e => setProductForm(f => ({ ...f, barcode: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleSaveProduct} style={{
                padding: '9px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>{t('save')}</button>
              <button onClick={() => setShowProductForm(false)} style={{
                padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>
        )}

        {groupedProducts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 14 }}>
            {q ? `Aucun produit trouvé pour « ${search} »` : t('noProducts')}
          </div>
        )}

        {groupedProducts.map(({ cat, products: prods }) => {
          if (prods.length === 0) return null
          const color = COLORS[cat.colorIndex ?? categories.indexOf(cat) % 8]
          return (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                padding: '8px 14px', background: color.light, borderRadius: 8,
                borderLeft: `4px solid ${color.hex}`,
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color.hex }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1D2433' }}>{cat.name}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>({prods.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {prods.map((product, i) => (
                  <ProductCard key={product.id}
                    product={product} color={color} index={i}
                    onEdit={() => openProductForm(product)}
                    onDelete={() => handleDeleteProduct(product)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductCard({ product, color, index, onEdit, onDelete, t }) {
  const [hovered, setHovered] = useState(false)
  const alpha = Math.max(0.06, 0.18 - index * 0.02)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 180, borderRadius: 10, padding: '14px 14px 10px',
        background: `linear-gradient(135deg, ${color.light} 0%, rgba(255,255,255,${alpha}) 100%)`,
        border: `1.5px solid ${hovered ? color.hex : color.mid}`,
        boxShadow: hovered ? `0 4px 16px ${color.hex}33` : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.15s', position: 'relative',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1D2433', marginBottom: 6 }}>{product.name}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color.hex }}>{product.price} DH</div>
      {product.costPrice > 0 && (
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Achat: {product.costPrice} DH</div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={onEdit} style={{ flex: 1, padding: '5px 0', background: color.light, border: `1px solid ${color.mid}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>✏️</button>
        <button onClick={onDelete} style={{ flex: 1, padding: '5px 0', background: '#FCEBEB', border: '1px solid #FECACA', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>🗑️</button>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inp = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 14 }
const errInp = { borderColor: '#E24B4A' }
const ferr = { color: '#E24B4A', fontSize: 11, marginTop: 3 }

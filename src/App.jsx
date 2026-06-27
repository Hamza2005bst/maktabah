import { useState, useEffect, useCallback } from 'react'
import { useT } from './i18n.js'
import { api } from './api.js'
import Auth from './components/Auth.jsx'
import Layout from './components/Layout.jsx'
import Admin from './components/Admin.jsx'
import POS from './components/POS.jsx'
import Products from './components/Products.jsx'
import Lists from './components/Lists.jsx'
import Sales from './components/Sales.jsx'
import Analytics from './components/Analytics.jsx'
import Loyalty from './components/Loyalty.jsx'
import PlansModal from './components/PlansModal.jsx'

function Toast({ msg }) {
  return (
    <div
      style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        background: '#1D2433', color: '#fff', padding: '12px 28px',
        borderRadius: 10, zIndex: 9999, fontSize: 15, fontWeight: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)', pointerEvents: 'none',
        animation: 'fadeInDown 0.25s ease',
      }}
    >
      {msg}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontSize: 18, color: '#6B7280',
    }}>
      Chargement…
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('login')
  const [storePage, setStorePageState] = useState(() => localStorage.getItem('mkb_storePage') || 'pos')
  const [currentUser, setCurrentUser] = useState(null)
  const [lang, setLangState] = useState(() => localStorage.getItem('mkb_lang') || 'fr')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPlans, setShowPlans] = useState(false)

  // Store data
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [cities, setCities] = useState([])
  const [schools, setSchools] = useState([])
  const [lists, setLists] = useState([])
  const [listItems, setListItems] = useState([])
  const [sales, setSales] = useState([])
  const [saleItems, setSaleItems] = useState([])
  const [loyaltySetting, setLoyaltySetting] = useState({ pointsPerDh: 1, pointsForDh: 25 })
  const [loyaltyCards, setLoyaltyCards] = useState([])

  // Admin data
  const [stores, setStores] = useState([])
  const [allSales, setAllSales] = useState([])
  const [allSaleItems, setAllSaleItems] = useState([])
  const [adminCities, setAdminCities] = useState([])
  const [adminSchools, setAdminSchools] = useState([])
  const [adminLists, setAdminLists] = useState([])
  const [adminListItems, setAdminListItems] = useState([])

  const t = useT(lang)

  const setLang = useCallback((l) => {
    setLangState(l)
    localStorage.setItem('mkb_lang', l)
  }, [])

  const setStorePage = useCallback((page) => {
    setStorePageState(page)
    localStorage.setItem('mkb_storePage', page)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleApiError = useCallback((err) => {
    if (err.status === 401) { logout(); return }
    if (err.error === 'planLimit') { setShowPlans(true); return }
    showToast(err.error || 'Erreur serveur')
  }, [showToast])

  const clearStoreData = useCallback(() => {
    setCategories([]); setProducts([]); setCities([]); setSchools([])
    setLists([]); setListItems([]); setSales([]); setSaleItems([])
    setLoyaltySetting({ pointsPerDh: 1, pointsForDh: 25 }); setLoyaltyCards([])
  }, [])

  const clearAdminData = useCallback(() => {
    setStores([]); setAllSales([]); setAllSaleItems([])
    setAdminCities([]); setAdminSchools([]); setAdminLists([]); setAdminListItems([])
  }, [])

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadStoreData = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, prods, citiesData, schoolsData, listsData, salesData, settingData, cardsData] =
        await Promise.all([
          api.categories.list(),
          api.products.list(),
          api.cities.list(),
          api.schools.list(),
          api.lists.list(),
          api.sales.list(),
          api.loyalty.getSettings(),
          api.loyalty.listCards(),
        ])
      setCategories(cats)
      setProducts(prods)
      setCities(citiesData)
      setSchools(schoolsData)
      setLists(listsData.lists)
      setListItems(listsData.listItems)
      setSales(salesData.sales)
      setSaleItems(salesData.saleItems)
      setLoyaltySetting(settingData)
      setLoyaltyCards(cardsData)
    } catch (err) {
      if (err.status === 401) logout()
      else showToast('Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    try {
      const [storesData, salesData, adminCitiesData, adminSchoolsData, adminListsData] =
        await Promise.all([
          api.admin.getStores(),
          api.admin.getSales(),
          api.admin.getCities(),
          api.admin.getSchools(),
          api.admin.getLists(),
        ])
      setStores(storesData)
      setAllSales(salesData.sales)
      setAllSaleItems(salesData.saleItems)
      setAdminCities(adminCitiesData)
      setAdminSchools(adminSchoolsData)
      setAdminLists(adminListsData.lists)
      setAdminListItems(adminListsData.listItems)
    } catch (err) {
      if (err.status === 401) logout()
      else showToast('Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Restore session on mount
  useEffect(() => {
    const token = api.getToken()
    const savedUser = localStorage.getItem('mkb_user')
    if (!token || !savedUser) return
    try {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      if (user.role === 'admin') {
        setView('admin')
        loadAdminData()
      } else {
        setView('store')
        setStorePageState(localStorage.getItem('mkb_storePage') || 'pos')
        loadStoreData()
      }
    } catch {}
  }, [])

  // Auto-refresh admin data every 15 seconds to receive new client requests
  useEffect(() => {
    if (view !== 'admin') return
    const interval = setInterval(() => {
      api.admin.getStores().then(storesData => setStores(storesData)).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [view])

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    api.clearToken()
    localStorage.removeItem('mkb_user')
    setCurrentUser(null)
    setView('login')
    setStorePageState('pos')
    clearStoreData()
    clearAdminData()
  }, [clearStoreData, clearAdminData])

  const login = useCallback(async (identifier, password) => {
    try {
      const { token, user } = await api.auth.login(identifier, password)
      api.setToken(token)
      localStorage.setItem('mkb_user', JSON.stringify(user))
      setCurrentUser(user)
      if (user.role === 'admin') {
        setView('admin')
        await loadAdminData()
      } else {
        setView('store')
        setStorePage('pos')
        await loadStoreData()
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.error || 'invalidCredentials' }
    }
  }, [loadStoreData, loadAdminData, setStorePage])

  const register = useCallback(async (data) => {
    try {
      const res = await api.auth.register(data)
      if (res.message === 'pending') return { ok: true }
      api.setToken(res.token)
      localStorage.setItem('mkb_user', JSON.stringify(res.user))
      setCurrentUser(res.user)
      setView('store')
      setStorePage('pos')
      await loadStoreData()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.error || 'serverError' }
    }
  }, [loadStoreData, setStorePage])

  const changePlan = useCallback(async (plan) => {
    try {
      const res = await api.auth.planRequest(plan)
      setCurrentUser(prev => {
        const updated = { ...prev, pendingPlan: res.pendingPlan }
        localStorage.setItem('mkb_user', JSON.stringify(updated))
        return updated
      })
      setShowPlans(false)
      showToast("Demande envoyée — en attente de validation par l'admin.")
    } catch (err) {
      handleApiError(err)
    }
  }, [showToast, handleApiError])

  // ─── Categories ──────────────────────────────────────────────────────────────

  const addCategory = useCallback(async (name, colorIndex) => {
    try {
      const cat = await api.categories.create({ name, colorIndex })
      setCategories(prev => [...prev, cat])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const updateCategory = useCallback(async (id, name) => {
    try {
      const cat = await api.categories.update(id, { name })
      setCategories(prev => prev.map(c => c.id === id ? cat : c))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteCategory = useCallback(async (catId) => {
    try {
      await api.categories.delete(catId)
      setCategories(prev => prev.filter(c => c.id !== catId))
      setProducts(prev => prev.filter(p => p.categoryId !== catId))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Products ────────────────────────────────────────────────────────────────

  const addProduct = useCallback(async (data) => {
    try {
      const prod = await api.products.create(data)
      setProducts(prev => [...prev, prod])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const updateProduct = useCallback(async (id, data) => {
    try {
      const prod = await api.products.update(id, data)
      setProducts(prev => prev.map(p => p.id === id ? prod : p))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteProduct = useCallback(async (id) => {
    try {
      await api.products.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setListItems(prev => prev.filter(li => li.productId !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Cities ──────────────────────────────────────────────────────────────────

  const addCity = useCallback(async (name) => {
    try {
      const city = await api.cities.create({ name })
      setCities(prev => [...prev, city])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteCity = useCallback(async (id) => {
    try {
      await api.cities.delete(id)
      // Mirror backend cascade in local state
      setSchools(prev => {
        const removed = prev.filter(s => s.cityId === id).map(s => s.id)
        setLists(prevL => {
          const removedLists = prevL.filter(l => removed.includes(l.schoolId)).map(l => l.id)
          setListItems(prevLI => prevLI.filter(li => !removedLists.includes(li.listId)))
          return prevL.filter(l => !removed.includes(l.schoolId))
        })
        return prev.filter(s => s.cityId !== id)
      })
      setCities(prev => prev.filter(c => c.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Schools ─────────────────────────────────────────────────────────────────

  const addSchool = useCallback(async (name, cityId) => {
    try {
      const school = await api.schools.create({ name, cityId })
      setSchools(prev => [...prev, school])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteSchool = useCallback(async (id) => {
    try {
      await api.schools.delete(id)
      setLists(prev => {
        const removedLists = prev.filter(l => l.schoolId === id).map(l => l.id)
        setListItems(prevLI => prevLI.filter(li => !removedLists.includes(li.listId)))
        return prev.filter(l => l.schoolId !== id)
      })
      setSchools(prev => prev.filter(s => s.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Lists ───────────────────────────────────────────────────────────────────

  const addList = useCallback(async (data, items) => {
    try {
      const res = await api.lists.create({ name: data.name, schoolId: data.schoolId, items })
      setLists(prev => [...prev, { id: res.id, name: res.name, schoolId: res.schoolId, storeId: res.storeId }])
      setListItems(prev => [...prev, ...(res.items || []).map(i => ({ listId: res.id, productId: i.productId, quantity: i.quantity }))])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const updateList = useCallback(async (id, data, items) => {
    try {
      const res = await api.lists.update(id, { name: data.name, schoolId: data.schoolId, items })
      setLists(prev => prev.map(l => l.id === id ? { ...l, name: res.name, schoolId: res.schoolId } : l))
      setListItems(prev => [
        ...prev.filter(li => li.listId !== id),
        ...(res.items || []).map(i => ({ listId: id, productId: i.productId, quantity: i.quantity })),
      ])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteList = useCallback(async (id) => {
    try {
      await api.lists.delete(id)
      setLists(prev => prev.filter(l => l.id !== id))
      setListItems(prev => prev.filter(li => li.listId !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Sales ───────────────────────────────────────────────────────────────────

  const addSale = useCallback(async (clientName, cartItems, loyaltyOpts = {}) => {
    try {
      const res = await api.sales.create({ clientName, cartItems, loyaltyOpts })
      setSales(prev => [...prev, res.sale])
      setSaleItems(prev => [...prev, ...res.saleItems])
      if (loyaltyOpts.cardId) {
        setLoyaltyCards(prev => prev.map(c => {
          if (c.id !== loyaltyOpts.cardId) return c
          return { ...c, points: Math.max(0, c.points - (loyaltyOpts.pointsRedeemed || 0) + (loyaltyOpts.pointsEarned || 0)) }
        }))
      }
      showToast(t('saleRegistered'))
      return res.sale.id
    } catch (err) {
      handleApiError(err)
      return null
    }
  }, [t, showToast, handleApiError])

  const toggleSalePaid = useCallback(async (id) => {
    try {
      const sale = await api.sales.togglePaid(id)
      setSales(prev => prev.map(s => s.id === id ? sale : s))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Loyalty ─────────────────────────────────────────────────────────────────

  const updateLoyaltySettings = useCallback(async (data) => {
    try {
      const settings = await api.loyalty.updateSettings(data)
      setLoyaltySetting(settings)
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const addLoyaltyCard = useCallback(async (data) => {
    try {
      const card = await api.loyalty.createCard(data)
      setLoyaltyCards(prev => [...prev, card])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const updateLoyaltyCard = useCallback(async (id, data) => {
    try {
      const card = await api.loyalty.updateCard(id, data)
      setLoyaltyCards(prev => prev.map(c => c.id === id ? card : c))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const adjustLoyaltyPoints = useCallback(async (id, delta) => {
    try {
      const card = await api.loyalty.adjustPoints(id, delta)
      setLoyaltyCards(prev => prev.map(c => c.id === id ? card : c))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteLoyaltyCard = useCallback(async (id) => {
    try {
      await api.loyalty.deleteCard(id)
      setLoyaltyCards(prev => prev.filter(c => c.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Admin: stores ───────────────────────────────────────────────────────────

  const updateStore = useCallback(async (id, data) => {
    try {
      const store = await api.admin.updateStore(id, data)
      setStores(prev => prev.map(s => s.id === id ? store : s))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const toggleStoreActive = useCallback(async (id) => {
    try {
      const store = await api.admin.toggleStoreActive(id)
      setStores(prev => prev.map(s => s.id === id ? store : s))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteStore = useCallback(async (id) => {
    try {
      await api.admin.deleteStore(id)
      setStores(prev => prev.filter(s => s.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Admin: cities ───────────────────────────────────────────────────────────

  const addAdminCity = useCallback(async (name, id) => {
    try {
      const city = await api.admin.createCity({ name, id })
      setAdminCities(prev => [...prev, city])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteAdminCity = useCallback(async (id) => {
    try {
      await api.admin.deleteCity(id)
      setAdminSchools(prev => {
        const removed = prev.filter(s => s.cityId === id).map(s => s.id)
        setAdminLists(prevL => {
          const removedLists = prevL.filter(l => removed.includes(l.schoolId)).map(l => l.id)
          setAdminListItems(prevLI => prevLI.filter(li => !removedLists.includes(li.listId)))
          return prevL.filter(l => !removed.includes(l.schoolId))
        })
        return prev.filter(s => s.cityId !== id)
      })
      setAdminCities(prev => prev.filter(c => c.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Admin: schools ──────────────────────────────────────────────────────────

  const addAdminSchool = useCallback(async (name, cityId, id) => {
    try {
      const school = await api.admin.createSchool({ name, cityId, id })
      setAdminSchools(prev => [...prev, school])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteAdminSchool = useCallback(async (id) => {
    try {
      await api.admin.deleteSchool(id)
      setAdminLists(prev => {
        const removedLists = prev.filter(l => l.schoolId === id).map(l => l.id)
        setAdminListItems(prevLI => prevLI.filter(li => !removedLists.includes(li.listId)))
        return prev.filter(l => l.schoolId !== id)
      })
      setAdminSchools(prev => prev.filter(s => s.id !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Admin: lists ────────────────────────────────────────────────────────────

  const saveAdminList = useCallback(async (existingListId, schoolId, gradeName, items) => {
    try {
      const res = await api.admin.saveList({ existingListId, schoolId, gradeName, items })
      if (!existingListId) {
        setAdminLists(prev => [...prev, res.list])
      }
      setAdminListItems(prev => [
        ...prev.filter(li => li.listId !== res.list.id),
        ...res.listItems,
      ])
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  const deleteAdminList = useCallback(async (id) => {
    try {
      await api.admin.deleteList(id)
      setAdminLists(prev => prev.filter(l => l.id !== id))
      setAdminListItems(prev => prev.filter(li => li.listId !== id))
    } catch (err) { handleApiError(err) }
  }, [handleApiError])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const rtl = lang === 'ar'

  const sharedProps = {
    t, lang, setLang, currentUser, showToast,
    showPlansModal: () => setShowPlans(true),
    changePlan,
    categories, products,
    cities, schools,
    lists, listItems, sales, saleItems,
    allSales: sales,
    loyaltyCards,
    loyaltySetting,
    adminCities: [], adminSchools: [], adminLists: [], adminListItems: [],
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    addCity, deleteCity, addSchool, deleteSchool,
    addList, updateList, deleteList,
    addSale, toggleSalePaid,
    updateLoyaltySettings, addLoyaltyCard, updateLoyaltyCard, adjustLoyaltyPoints, deleteLoyaltyCard,
  }

  const fadeInStyle = `@keyframes fadeInDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`

  if (loading) {
    return (
      <>
        <style>{fadeInStyle}</style>
        <LoadingScreen />
      </>
    )
  }

  if (view === 'login' || view === 'register') {
    return (
      <>
        <style>{fadeInStyle}</style>
        {toast && <Toast msg={toast} />}
        <Auth
          view={view} setView={setView}
          login={login} register={register}
          t={t} lang={lang} setLang={setLang} rtl={rtl}
        />
      </>
    )
  }

  if (view === 'admin') {
    return (
      <>
        <style>{fadeInStyle}</style>
        {toast && <Toast msg={toast} />}
        <Admin
          t={t} lang={lang} setLang={setLang} rtl={rtl}
          stores={stores} updateStore={updateStore} toggleStoreActive={toggleStoreActive} deleteStore={deleteStore}
          allSales={allSales} allSaleItems={allSaleItems} logout={logout}
          adminCities={adminCities} adminSchools={adminSchools}
          adminLists={adminLists} adminListItems={adminListItems}
          addAdminCity={addAdminCity} deleteAdminCity={deleteAdminCity}
          addAdminSchool={addAdminSchool} deleteAdminSchool={deleteAdminSchool}
          saveAdminList={saveAdminList} deleteAdminList={deleteAdminList}
        />
      </>
    )
  }

  // Store view
  const pageComponents = {
    pos: <POS {...sharedProps} />,
    products: <Products {...sharedProps} />,
    lists: <Lists {...sharedProps} />,
    sales: <Sales {...sharedProps} />,
    loyalty: <Loyalty {...sharedProps} />,
    analytics: <Analytics {...sharedProps} />,
  }

  return (
    <>
      <style>{fadeInStyle}</style>
      {toast && <Toast msg={toast} />}
      {showPlans && (
        <PlansModal
          currentUser={currentUser}
          onChangePlan={changePlan}
          onClose={() => setShowPlans(false)}
        />
      )}
      <Layout
        t={t} lang={lang} setLang={setLang} rtl={rtl}
        currentUser={currentUser} storePage={storePage} setStorePage={setStorePage}
        logout={logout}
      >
        {pageComponents[storePage]}
      </Layout>
    </>
  )
}

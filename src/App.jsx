import { useState, useCallback } from 'react'
import { uid, formatDate, formatTime, PLAN_LIMITS } from './constants.js'
import { useT } from './i18n.js'
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

function buildDefaultData(storeId) {
  const [cpf, cgf, liv, tro, couv, div] = Array.from({ length: 6 }, uid)
  const cats = [
    { id: cpf,  name: 'Cahiers petits format', colorIndex: 0, storeId },
    { id: cgf,  name: 'Cahiers grands format', colorIndex: 1, storeId },
    { id: liv,  name: 'Livres',                colorIndex: 2, storeId },
    { id: tro,  name: 'Trousse',               colorIndex: 3, storeId },
    { id: couv, name: 'Couvertures',            colorIndex: 4, storeId },
    { id: div,  name: 'Divers',                 colorIndex: 5, storeId },
  ]
  const p = (name, categoryId) => ({ id: uid(), name, price: 0, costPrice: 0, categoryId, storeId })
  const prods = [
    p('Cahier 48',                       cpf),
    p('Cahier 96',                       cpf),
    p('Cahier 144',                      cgf),
    p('Cahier 192',                      cgf),
    p("Coquelicot 6 Manuel de l'élève",  liv),
    p("Coquelicot 6 Livret d'activité",  liv),
    p('Stylo bleu Bic',                  tro),
    p('Stylo vert Bic',                  tro),
    p('Stylo noir Bic',                  tro),
    p('Stylo rouge Bic',                 tro),
    p('Règle',                           tro),
    p('Gomme Maped',                     tro),
    p('Gomme normal',                    tro),
    p('Crayon Maped',                    tro),
    p('Crayon normal',                   tro),
    p('Crayons colorées Maped',          tro),
    p('Crayons colorées normal',         tro),
    p('Grande format',                   couv),
    p('Petite format',                   couv),
  ]
  return { cats, prods }
}

const INITIAL_STORES = [
  {
    id: 'admin',
    storeName: 'Maktaba Admin',
    phone: '',
    email: 'admin@maktaba.ma',
    password: 'admin123',
    plan: 'admin',
    paid: true,
    active: true,
    role: 'admin',
    startDate: '',
    endDate: '',
  },
  {
    id: 'demo',
    storeName: 'Librairie Al Amal',
    phone: '0612345678',
    email: '',
    password: 'demo123',
    plan: 'premium',
    paid: true,
    active: true,
    role: 'store',
    startDate: '2025-09-01',
    endDate: '2026-09-01',
  },
]

// --- Seed data for demo store ---
const DEMO_CATS = [
  { id: 'c1', name: 'Cahiers & Classeurs', colorIndex: 0, storeId: 'demo' },
  { id: 'c2', name: 'Stylos & Crayons',    colorIndex: 1, storeId: 'demo' },
  { id: 'c3', name: 'Livres scolaires',    colorIndex: 2, storeId: 'demo' },
  { id: 'c4', name: 'Géométrie & Outils',  colorIndex: 4, storeId: 'demo' },
  { id: 'c5', name: 'Divers',              colorIndex: 6, storeId: 'demo' },
]

const DEMO_PRODUCTS = [
  { id: 'p1',  name: 'Cahier 96 pages',       price: 5,   costPrice: 2.5, categoryId: 'c1', storeId: 'demo' },
  { id: 'p2',  name: 'Cahier 192 pages',      price: 9,   costPrice: 4.5, categoryId: 'c1', storeId: 'demo' },
  { id: 'p3',  name: 'Classeur A4',           price: 18,  costPrice: 9,   categoryId: 'c1', storeId: 'demo' },
  { id: 'p4',  name: 'Pochettes plastiques',  price: 6,   costPrice: 2.5, categoryId: 'c1', storeId: 'demo' },
  { id: 'p5',  name: 'Stylo bille bleu',      price: 2,   costPrice: 0.8, categoryId: 'c2', storeId: 'demo' },
  { id: 'p6',  name: 'Stylo bille rouge',     price: 2,   costPrice: 0.8, categoryId: 'c2', storeId: 'demo' },
  { id: 'p7',  name: 'Crayon HB',             price: 1.5, costPrice: 0.5, categoryId: 'c2', storeId: 'demo' },
  { id: 'p8',  name: 'Stylo effaçable',       price: 5,   costPrice: 2,   categoryId: 'c2', storeId: 'demo' },
  { id: 'p9',  name: 'Surligneur jaune',      price: 4,   costPrice: 1.5, categoryId: 'c2', storeId: 'demo' },
  { id: 'p10', name: 'Lecture CE1',           price: 45,  costPrice: 30,  categoryId: 'c3', storeId: 'demo' },
  { id: 'p11', name: 'Maths CM2',             price: 50,  costPrice: 33,  categoryId: 'c3', storeId: 'demo' },
  { id: 'p12', name: 'Français 6ème',         price: 55,  costPrice: 36,  categoryId: 'c3', storeId: 'demo' },
  { id: 'p13', name: 'Règle 30cm',            price: 5,   costPrice: 2,   categoryId: 'c4', storeId: 'demo' },
  { id: 'p14', name: 'Équerre',               price: 7,   costPrice: 3,   categoryId: 'c4', storeId: 'demo' },
  { id: 'p15', name: 'Compas métal',          price: 15,  costPrice: 7,   categoryId: 'c4', storeId: 'demo' },
  { id: 'p16', name: 'Rapporteur',            price: 5,   costPrice: 2,   categoryId: 'c4', storeId: 'demo' },
  { id: 'p17', name: 'Colle en bâton',        price: 6,   costPrice: 2.5, categoryId: 'c5', storeId: 'demo' },
  { id: 'p18', name: 'Ciseaux scolaires',     price: 12,  costPrice: 5,   categoryId: 'c5', storeId: 'demo' },
  { id: 'p19', name: 'Taille-crayon',         price: 3,   costPrice: 1,   categoryId: 'c5', storeId: 'demo' },
  { id: 'p20', name: 'Gomme blanche',         price: 2,   costPrice: 0.7, categoryId: 'c5', storeId: 'demo' },
]

const DEMO_CITIES = [
  { id: 'v1', name: 'Casablanca', storeId: 'demo' },
  { id: 'v2', name: 'Rabat',      storeId: 'demo' },
]

const DEMO_SCHOOLS = [
  { id: 's1', name: 'École Ibn Khaldoun', cityId: 'v1', storeId: 'demo' },
  { id: 's2', name: 'École Al Farabi',    cityId: 'v1', storeId: 'demo' },
  { id: 's3', name: 'École Hassan II',    cityId: 'v2', storeId: 'demo' },
]

const DEMO_LISTS = [
  { id: 'l1', name: 'Liste CE1 — A',  schoolId: 's1', storeId: 'demo' },
  { id: 'l2', name: 'Liste CM2 — B',  schoolId: 's2', storeId: 'demo' },
  { id: 'l3', name: 'Liste 6ème',     schoolId: 's3', storeId: 'demo' },
]

const DEMO_LIST_ITEMS = [
  // CE1
  { listId: 'l1', productId: 'p1',  quantity: 5 },
  { listId: 'l1', productId: 'p5',  quantity: 3 },
  { listId: 'l1', productId: 'p7',  quantity: 2 },
  { listId: 'l1', productId: 'p20', quantity: 1 },
  { listId: 'l1', productId: 'p19', quantity: 1 },
  { listId: 'l1', productId: 'p10', quantity: 1 },
  // CM2
  { listId: 'l2', productId: 'p2',  quantity: 4 },
  { listId: 'l2', productId: 'p3',  quantity: 1 },
  { listId: 'l2', productId: 'p5',  quantity: 2 },
  { listId: 'l2', productId: 'p6',  quantity: 1 },
  { listId: 'l2', productId: 'p13', quantity: 1 },
  { listId: 'l2', productId: 'p15', quantity: 1 },
  { listId: 'l2', productId: 'p11', quantity: 1 },
  // 6ème
  { listId: 'l3', productId: 'p2',  quantity: 6 },
  { listId: 'l3', productId: 'p3',  quantity: 2 },
  { listId: 'l3', productId: 'p8',  quantity: 3 },
  { listId: 'l3', productId: 'p14', quantity: 1 },
  { listId: 'l3', productId: 'p15', quantity: 1 },
  { listId: 'l3', productId: 'p16', quantity: 1 },
  { listId: 'l3', productId: 'p12', quantity: 1 },
  { listId: 'l3', productId: 'p17', quantity: 1 },
]

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const DEMO_SALES = [
  { id: 'sa1', storeId: 'demo', clientName: 'Fatima Zahra', date: fmtD(daysAgo(0)), time: '09:15', total: 74,  paid: true,  rawDate: daysAgo(0).toISOString() },
  { id: 'sa2', storeId: 'demo', clientName: 'Youssef El Amrani', date: fmtD(daysAgo(0)), time: '11:30', total: 118, paid: false, rawDate: daysAgo(0).toISOString() },
  { id: 'sa3', storeId: 'demo', clientName: '',             date: fmtD(daysAgo(1)), time: '14:00', total: 36,  paid: true,  rawDate: daysAgo(1).toISOString() },
  { id: 'sa4', storeId: 'demo', clientName: 'Khadija Benali', date: fmtD(daysAgo(2)), time: '10:45', total: 145, paid: true,  rawDate: daysAgo(2).toISOString() },
  { id: 'sa5', storeId: 'demo', clientName: 'Omar Tazi',    date: fmtD(daysAgo(3)), time: '16:20', total: 57,  paid: false, rawDate: daysAgo(3).toISOString() },
  { id: 'sa6', storeId: 'demo', clientName: '',             date: fmtD(daysAgo(5)), time: '09:50', total: 22,  paid: true,  rawDate: daysAgo(5).toISOString() },
  { id: 'sa7', storeId: 'demo', clientName: 'Aicha Idrissi', date: fmtD(daysAgo(6)), time: '13:10', total: 200, paid: true,  rawDate: daysAgo(6).toISOString() },
  { id: 'sa8', storeId: 'demo', clientName: 'Hassan Berrada', date: fmtD(daysAgo(8)), time: '11:00', total: 89,  paid: true,  rawDate: daysAgo(8).toISOString() },
]

// ---- Admin-managed global lists (shared with all stores) ----
const DEMO_ADMIN_CITIES = [
  { id: 'ac1', name: 'Casablanca' },
  { id: 'ac2', name: 'Rabat' },
  { id: 'ac3', name: 'Marrakech' },
]
const DEMO_ADMIN_SCHOOLS = [
  { id: 'as1', name: 'École Ibn Khaldoun', cityId: 'ac1' },
  { id: 'as2', name: 'École Al Farabi',    cityId: 'ac1' },
  { id: 'as3', name: 'École Hassan II',    cityId: 'ac2' },
]
const DEMO_ADMIN_LISTS = [
  { id: 'al1', name: 'CE1',  schoolId: 'as1' },
  { id: 'al2', name: 'CM2',  schoolId: 'as2' },
  { id: 'al3', name: '6ème primaire', schoolId: 'as3' },
]
const DEMO_ADMIN_LIST_ITEMS = [
  { id: 'ali1', listId: 'al1', productName: 'Cahier 96 pages',   quantity: 5, unitPrice: 5   },
  { id: 'ali2', listId: 'al1', productName: 'Stylo bille bleu',  quantity: 3, unitPrice: 2   },
  { id: 'ali3', listId: 'al1', productName: 'Crayon HB',         quantity: 2, unitPrice: 1.5 },
  { id: 'ali4', listId: 'al1', productName: 'Gomme blanche',     quantity: 1, unitPrice: 2   },
  { id: 'ali5', listId: 'al2', productName: 'Cahier 192 pages',  quantity: 4, unitPrice: 9   },
  { id: 'ali6', listId: 'al2', productName: 'Classeur A4',       quantity: 1, unitPrice: 18  },
  { id: 'ali7', listId: 'al2', productName: 'Compas métal',      quantity: 1, unitPrice: 15  },
  { id: 'ali8', listId: 'al3', productName: 'Cahier 192 pages',  quantity: 6, unitPrice: 9   },
  { id: 'ali9', listId: 'al3', productName: 'Classeur A4',       quantity: 2, unitPrice: 18  },
  { id: 'ali10', listId: 'al3', productName: 'Stylo effaçable',  quantity: 3, unitPrice: 5   },
  { id: 'ali11', listId: 'al3', productName: 'Règle 30cm',       quantity: 1, unitPrice: 5   },
]

const DEMO_LOYALTY_SETTINGS = [
  { storeId: 'demo', pointsPerDh: 1, pointsForDh: 25 },
]

const DEMO_LOYALTY_CARDS = [
  { id: 'lc1', storeId: 'demo', name: 'Fatima Zahra',      phone: '0661234567', points: 320 },
  { id: 'lc2', storeId: 'demo', name: 'Youssef El Amrani', phone: '0672345678', points: 180 },
  { id: 'lc3', storeId: 'demo', name: 'Khadija Benali',    phone: '0653456789', points: 450 },
  { id: 'lc4', storeId: 'demo', name: 'Omar Tazi',         phone: '0645678901', points: 95  },
]

const DEMO_SALE_ITEMS = [
  { saleId: 'sa1', productId: 'p1',  productName: 'Cahier 96 pages',   quantity: 5, price: 5,   costPrice: 2.5 },
  { saleId: 'sa1', productId: 'p5',  productName: 'Stylo bille bleu',  quantity: 3, price: 2,   costPrice: 0.8 },
  { saleId: 'sa1', productId: 'p20', productName: 'Gomme blanche',      quantity: 4, price: 2,   costPrice: 0.7 },
  { saleId: 'sa1', productId: 'p19', productName: 'Taille-crayon',      quantity: 2, price: 3,   costPrice: 1   },
  { saleId: 'sa2', productId: 'p3',  productName: 'Classeur A4',        quantity: 2, price: 18,  costPrice: 9   },
  { saleId: 'sa2', productId: 'p11', productName: 'Maths CM2',          quantity: 1, price: 50,  costPrice: 33  },
  { saleId: 'sa2', productId: 'p15', productName: 'Compas métal',       quantity: 2, price: 15,  costPrice: 7   },
  { saleId: 'sa3', productId: 'p5',  productName: 'Stylo bille bleu',   quantity: 6, price: 2,   costPrice: 0.8 },
  { saleId: 'sa3', productId: 'p7',  productName: 'Crayon HB',          quantity: 4, price: 1.5, costPrice: 0.5 },
  { saleId: 'sa3', productId: 'p20', productName: 'Gomme blanche',      quantity: 3, price: 2,   costPrice: 0.7 },
  { saleId: 'sa4', productId: 'p12', productName: 'Français 6ème',      quantity: 1, price: 55,  costPrice: 36  },
  { saleId: 'sa4', productId: 'p2',  productName: 'Cahier 192 pages',   quantity: 5, price: 9,   costPrice: 4.5 },
  { saleId: 'sa4', productId: 'p13', productName: 'Règle 30cm',         quantity: 1, price: 5,   costPrice: 2   },
  { saleId: 'sa4', productId: 'p17', productName: 'Colle en bâton',     quantity: 3, price: 6,   costPrice: 2.5 },
  { saleId: 'sa5', productId: 'p1',  productName: 'Cahier 96 pages',    quantity: 3, price: 5,   costPrice: 2.5 },
  { saleId: 'sa5', productId: 'p9',  productName: 'Surligneur jaune',   quantity: 4, price: 4,   costPrice: 1.5 },
  { saleId: 'sa5', productId: 'p18', productName: 'Ciseaux scolaires',  quantity: 2, price: 12,  costPrice: 5   },
  { saleId: 'sa6', productId: 'p7',  productName: 'Crayon HB',          quantity: 6, price: 1.5, costPrice: 0.5 },
  { saleId: 'sa6', productId: 'p20', productName: 'Gomme blanche',      quantity: 4, price: 2,   costPrice: 0.7 },
  { saleId: 'sa7', productId: 'p10', productName: 'Lecture CE1',        quantity: 2, price: 45,  costPrice: 30  },
  { saleId: 'sa7', productId: 'p11', productName: 'Maths CM2',          quantity: 1, price: 50,  costPrice: 33  },
  { saleId: 'sa7', productId: 'p4',  productName: 'Pochettes plastiques', quantity: 1, price: 6, costPrice: 2.5 },
  { saleId: 'sa7', productId: 'p14', productName: 'Équerre',            quantity: 2, price: 7,   costPrice: 3   },
  { saleId: 'sa8', productId: 'p2',  productName: 'Cahier 192 pages',   quantity: 3, price: 9,   costPrice: 4.5 },
  { saleId: 'sa8', productId: 'p15', productName: 'Compas métal',       quantity: 2, price: 15,  costPrice: 7   },
  { saleId: 'sa8', productId: 'p5',  productName: 'Stylo bille bleu',   quantity: 5, price: 2,   costPrice: 0.8 },
  { saleId: 'sa8', productId: 'p6',  productName: 'Stylo bille rouge',  quantity: 4, price: 2,   costPrice: 0.8 },
]

function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })
  const setValue = useCallback((value) => {
    setState(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      try { window.localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])
  return [state, setValue]
}

function Toast({ msg, onDone }) {
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

export default function App() {
  const [view, setView] = useLocalStorage('mkb_view', 'login')
  const [storePage, setStorePage] = useLocalStorage('mkb_storePage', 'pos')
  const [currentUser, setCurrentUser] = useLocalStorage('mkb_currentUser', null)
  const [lang, setLang] = useLocalStorage('mkb_lang', 'fr')
  const [toast, setToast] = useState(null)
  const [showPlans, setShowPlans] = useState(false)

  // All data
  const [stores, setStores] = useLocalStorage('mkb_stores', INITIAL_STORES)
  const [categories, setCategories] = useLocalStorage('mkb_categories', DEMO_CATS)
  const [products, setProducts] = useLocalStorage('mkb_products', DEMO_PRODUCTS)
  const [cities, setCities] = useLocalStorage('mkb_cities', DEMO_CITIES)
  const [schools, setSchools] = useLocalStorage('mkb_schools', DEMO_SCHOOLS)
  const [lists, setLists] = useLocalStorage('mkb_lists', DEMO_LISTS)
  const [listItems, setListItems] = useLocalStorage('mkb_listItems', DEMO_LIST_ITEMS)
  const [sales, setSales] = useLocalStorage('mkb_sales', DEMO_SALES)
  const [saleItems, setSaleItems] = useLocalStorage('mkb_saleItems', DEMO_SALE_ITEMS)
  const [loyaltySettings, setLoyaltySettings] = useLocalStorage('mkb_loyaltySettings', DEMO_LOYALTY_SETTINGS)
  const [loyaltyCards, setLoyaltyCards] = useLocalStorage('mkb_loyaltyCards', DEMO_LOYALTY_CARDS)
  // Global lists (admin-managed, shared with all stores)
  const [adminCities, setAdminCities] = useLocalStorage('mkb_adminCities', DEMO_ADMIN_CITIES)
  const [adminSchools, setAdminSchools] = useLocalStorage('mkb_adminSchools', DEMO_ADMIN_SCHOOLS)
  const [adminLists, setAdminLists] = useLocalStorage('mkb_adminLists', DEMO_ADMIN_LISTS)
  const [adminListItems, setAdminListItems] = useLocalStorage('mkb_adminListItems', DEMO_ADMIN_LIST_ITEMS)

  const t = useT(lang)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // --- Auth ---
  const login = useCallback((identifier, password) => {
    // Admin login by email
    const adminStore = stores.find(s => s.email === identifier && s.password === password && s.role === 'admin')
    if (adminStore) {
      setCurrentUser(adminStore)
      setView('admin')
      return { ok: true }
    }
    // Store login by phone
    const store = stores.find(s => s.phone === identifier && s.password === password && s.role !== 'admin')
    if (!store) return { ok: false, error: 'invalidCredentials' }
    if (!store.active) return { ok: false, error: 'accountInactive' }
    if (store.plan !== 'gratuit' && store.endDate) {
      const today = new Date().toISOString().split('T')[0]
      if (store.endDate < today) {
        setStores(prev => prev.map(s => s.id === store.id ? { ...s, active: false } : s))
        return { ok: false, error: 'subscriptionExpired' }
      }
    }
    setCurrentUser(store)
    setView('store')
    setStorePage('pos')
    return { ok: true }
  }, [stores])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setView('login')
    setStorePage('pos')
  }, [])

  const register = useCallback((data) => {
    const isGratuit = data.plan === 'gratuit'
    const newStore = {
      id: uid(),
      storeName: data.storeName,
      phone: data.phone,
      email: '',
      password: data.password,
      plan: data.plan,
      paid: false,
      active: isGratuit,
      pending: !isGratuit,
      role: 'store',
      startDate: '',
      endDate: '',
      registeredAt: formatDate(new Date()),
    }
    setStores(prev => [...prev, newStore])
    if (!isGratuit) {
      const { cats, prods } = buildDefaultData(newStore.id)
      setCategories(prev => [...prev, ...cats])
      setProducts(prev => [...prev, ...prods])
    }
    if (isGratuit) {
      setCurrentUser(newStore)
      setView('store')
      setStorePage('pos')
    }
    return { ok: true }
  }, [])

  // --- Store data helpers (scoped to currentUser.id) ---
  const storeId = currentUser?.id

  const changePlan = useCallback((plan) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, pendingPlan: plan } : s))
    setCurrentUser(prev => prev ? { ...prev, pendingPlan: plan } : prev)
    setShowPlans(false)
    showToast('Demande envoyée — en attente de validation par l\'admin.')
  }, [storeId, showToast])

  const storeCategories = categories.filter(c => c.storeId === storeId)
  const storeProducts = products.filter(p => p.storeId === storeId)
  const storeCities = cities.filter(c => c.storeId === storeId)
  const storeSchools = schools.filter(s => s.storeId === storeId)
  const storeLists = lists.filter(l => l.storeId === storeId)
  const storeSales = sales.filter(s => s.storeId === storeId)
  const storeLoyaltyCards = loyaltyCards.filter(c => c.storeId === storeId)
  const storeLoyaltySetting = loyaltySettings.find(s => s.storeId === storeId) || { pointsPerDh: 1, pointsForDh: 25 }

  // Categories
  const addCategory = useCallback((name, colorIndex) => {
    const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
    if (storeCategories.length >= limits.maxCategories) {
      setShowPlans(true)
      return
    }
    setCategories(prev => [...prev, { id: uid(), name, colorIndex, storeId }])
  }, [storeId, currentUser?.plan, storeCategories.length])

  const deleteCategory = useCallback((catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId))
    setProducts(prev => prev.filter(p => p.categoryId !== catId))
  }, [])

  const updateCategory = useCallback((id, name) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
  }, [])

  // Products
  const addProduct = useCallback((data) => {
    const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
    const catCount = products.filter(p => p.storeId === storeId && p.categoryId === data.categoryId).length
    if (catCount >= limits.maxProductsPerCat) {
      setShowPlans(true)
      return
    }
    setProducts(prev => [...prev, { id: uid(), storeId, ...data }])
  }, [storeId, currentUser?.plan, products])

  const updateProduct = useCallback((id, data) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }, [])

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    setListItems(prev => prev.filter(li => li.productId !== id))
  }, [])

  // Cities
  const addCity = useCallback((name) => {
    setCities(prev => [...prev, { id: uid(), name, storeId }])
  }, [storeId])

  const deleteCity = useCallback((id) => {
    const schoolIds = schools.filter(s => s.cityId === id).map(s => s.id)
    setCities(prev => prev.filter(c => c.id !== id))
    setSchools(prev => prev.filter(s => s.cityId !== id))
    setLists(prev => prev.filter(l => !schoolIds.includes(l.schoolId)))
    setListItems(prev => {
      const listIds = lists.filter(l => schoolIds.includes(l.schoolId)).map(l => l.id)
      return prev.filter(li => !listIds.includes(li.listId))
    })
  }, [schools, lists])

  // Schools
  const addSchool = useCallback((name, cityId) => {
    const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
    if (storeSchools.length >= limits.maxSchools) {
      setShowPlans(true)
      return
    }
    setSchools(prev => [...prev, { id: uid(), name, cityId, storeId }])
  }, [storeId, currentUser?.plan, storeSchools.length])

  const deleteSchool = useCallback((id) => {
    setSchools(prev => prev.filter(s => s.id !== id))
    const schoolLists = lists.filter(l => l.schoolId === id).map(l => l.id)
    setLists(prev => prev.filter(l => l.schoolId !== id))
    setListItems(prev => prev.filter(li => !schoolLists.includes(li.listId)))
  }, [lists])

  // Lists
  const addList = useCallback((data, items) => {
    const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
    if (storeLists.length >= limits.maxLists) {
      setShowPlans(true)
      return
    }
    const listId = uid()
    setLists(prev => [...prev, { id: listId, storeId, ...data }])
    setListItems(prev => [...prev, ...items.map(item => ({ ...item, listId }))])
  }, [storeId, currentUser?.plan, storeLists.length])

  const updateList = useCallback((id, data, items) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
    setListItems(prev => [...prev.filter(li => li.listId !== id), ...items.map(item => ({ ...item, listId: id }))])
  }, [])

  const deleteList = useCallback((id) => {
    setLists(prev => prev.filter(l => l.id !== id))
    setListItems(prev => prev.filter(li => li.listId !== id))
  }, [])

  // Sales
  const addSale = useCallback((clientName, cartItems, loyaltyOpts = {}) => {
    const saleId = uid()
    const now = new Date()
    const rawTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const discount = loyaltyOpts.discountDh || 0
    const total = Math.max(0, rawTotal - discount)
    const newSale = {
      id: saleId,
      storeId,
      clientName,
      date: formatDate(now),
      time: formatTime(now),
      total,
      paid: false,
      rawDate: now.toISOString(),
      loyaltyCardId: loyaltyOpts.cardId || null,
      pointsEarned: loyaltyOpts.pointsEarned || 0,
      pointsRedeemed: loyaltyOpts.pointsRedeemed || 0,
    }
    setSales(prev => [...prev, newSale])
    setSaleItems(prev => [...prev, ...cartItems.map(i => ({
      saleId,
      productId: i.id,
      productName: i.name,
      quantity: i.quantity,
      price: i.price,
      costPrice: i.costPrice || 0,
    }))])
    // Update loyalty card if linked
    if (loyaltyOpts.cardId) {
      setLoyaltyCards(prev => prev.map(c => {
        if (c.id !== loyaltyOpts.cardId) return c
        return { ...c, points: c.points - (loyaltyOpts.pointsRedeemed || 0) + (loyaltyOpts.pointsEarned || 0) }
      }))
    }
    showToast(t('saleRegistered'))
    return saleId
  }, [storeId, t, showToast])

  // Loyalty
  const updateLoyaltySettings = useCallback((data) => {
    setLoyaltySettings(prev => {
      const exists = prev.find(s => s.storeId === storeId)
      if (exists) return prev.map(s => s.storeId === storeId ? { ...s, ...data } : s)
      return [...prev, { storeId, ...data }]
    })
  }, [storeId])

  const addLoyaltyCard = useCallback((data) => {
    const limits = PLAN_LIMITS[currentUser?.plan] || PLAN_LIMITS.premium
    if (storeLoyaltyCards.length >= limits.maxLoyalty) {
      setShowPlans(true)
      return
    }
    setLoyaltyCards(prev => [...prev, { id: uid(), storeId, points: 0, ...data }])
  }, [storeId, currentUser?.plan, storeLoyaltyCards.length])

  const updateLoyaltyCard = useCallback((id, data) => {
    setLoyaltyCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }, [])

  const adjustLoyaltyPoints = useCallback((id, delta) => {
    setLoyaltyCards(prev => prev.map(c => c.id === id ? { ...c, points: Math.max(0, c.points + delta) } : c))
  }, [])

  const deleteLoyaltyCard = useCallback((id) => {
    setLoyaltyCards(prev => prev.filter(c => c.id !== id))
  }, [])

  // Admin global list mutations
  const addAdminCity = useCallback((name, id) => {
    setAdminCities(prev => [...prev, { id: id || uid(), name }])
  }, [])
  const deleteAdminCity = useCallback((id) => {
    const schoolIds = adminSchools.filter(s => s.cityId === id).map(s => s.id)
    setAdminCities(prev => prev.filter(c => c.id !== id))
    setAdminSchools(prev => prev.filter(s => s.cityId !== id))
    const listIds = adminLists.filter(l => schoolIds.includes(l.schoolId)).map(l => l.id)
    setAdminLists(prev => prev.filter(l => !schoolIds.includes(l.schoolId)))
    setAdminListItems(prev => prev.filter(li => !listIds.includes(li.listId)))
  }, [adminSchools, adminLists])
  const addAdminSchool = useCallback((name, cityId, id) => {
    setAdminSchools(prev => [...prev, { id: id || uid(), name, cityId }])
  }, [])
  const deleteAdminSchool = useCallback((id) => {
    const listIds = adminLists.filter(l => l.schoolId === id).map(l => l.id)
    setAdminSchools(prev => prev.filter(s => s.id !== id))
    setAdminLists(prev => prev.filter(l => l.schoolId !== id))
    setAdminListItems(prev => prev.filter(li => !listIds.includes(li.listId)))
  }, [adminLists])
  const saveAdminList = useCallback((existingListId, schoolId, gradeName, items) => {
    const listId = existingListId || uid()
    if (!existingListId) {
      setAdminLists(prev => [...prev, { id: listId, name: gradeName, schoolId }])
    }
    setAdminListItems(prev => [
      ...prev.filter(li => li.listId !== listId),
      ...items.map(it => ({ id: uid(), listId, ...it })),
    ])
  }, [])
  const deleteAdminList = useCallback((id) => {
    setAdminLists(prev => prev.filter(l => l.id !== id))
    setAdminListItems(prev => prev.filter(li => li.listId !== id))
  }, [])

  const toggleSalePaid = useCallback((id) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, paid: !s.paid } : s))
  }, [])

  // Admin: update store
  const updateStore = useCallback((id, data) => {
    if (data.active === true) {
      const store = stores.find(s => s.id === id)
      if (store && !store.active && !['gratuit', 'admin'].includes(store.plan)) {
        if (!categories.some(c => c.storeId === id)) {
          const { cats, prods } = buildDefaultData(id)
          setCategories(prev => [...prev, ...cats])
          setProducts(prev => [...prev, ...prods])
        }
      }
    }
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    if (currentUser?.id === id) setCurrentUser(prev => ({ ...prev, ...data }))
  }, [currentUser, stores, categories])

  const toggleStoreActive = useCallback((id) => {
    const store = stores.find(s => s.id === id)
    if (store && !store.active && !['gratuit', 'admin'].includes(store.plan)) {
      if (!categories.some(c => c.storeId === id)) {
        const { cats, prods } = buildDefaultData(id)
        setCategories(prev => [...prev, ...cats])
        setProducts(prev => [...prev, ...prods])
      }
    }
    setStores(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }, [stores, categories])

  const deleteStore = useCallback((id) => {
    setStores(prev => prev.filter(s => s.id !== id))
  }, [])

  const sharedProps = {
    t, lang, setLang, currentUser, showToast,
    showPlansModal: () => setShowPlans(true),
    changePlan,
    // store data
    categories: storeCategories, products: storeProducts,
    cities: storeCities, schools: storeSchools,
    lists: storeLists, listItems, sales: storeSales, saleItems,
    allSales: sales,
    // loyalty
    loyaltyCards: storeLoyaltyCards,
    loyaltySetting: storeLoyaltySetting,
    // global admin lists (read-only for stores)
    adminCities, adminSchools, adminLists, adminListItems,
    // mutations
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    addCity, deleteCity, addSchool, deleteSchool,
    addList, updateList, deleteList,
    addSale, toggleSalePaid,
    updateLoyaltySettings, addLoyaltyCard, updateLoyaltyCard, adjustLoyaltyPoints, deleteLoyaltyCard,
  }

  const rtl = lang === 'ar'

  // Safety guard: if persisted view is store/admin but no user, reset to login
  const safeView = (view === 'store' || view === 'admin') && !currentUser ? 'login' : view

  if (safeView === 'login' || safeView === 'register') {
    return (
      <>
        <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        {toast && <Toast msg={toast} />}
        <Auth
          view={safeView} setView={setView}
          login={login} register={register}
          t={t} lang={lang} setLang={setLang} rtl={rtl}
        />
      </>
    )
  }

  if (safeView === 'admin') {
    return (
      <>
        <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        {toast && <Toast msg={toast} />}
        <Admin
          t={t} lang={lang} setLang={setLang} rtl={rtl}
          stores={stores} updateStore={updateStore} toggleStoreActive={toggleStoreActive} deleteStore={deleteStore}
          allSales={sales} allSaleItems={saleItems} logout={logout}
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
      <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
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

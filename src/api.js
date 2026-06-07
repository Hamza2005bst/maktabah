const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const TOKEN_KEY = 'mkb_token'

const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function call(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

const get = (path) => call('GET', path)
const post = (path, body) => call('POST', path, body)
const put = (path, body) => call('PUT', path, body)
const patch = (path, body) => call('PATCH', path, body)
const del = (path) => call('DELETE', path)

export const api = {
  getToken,
  setToken,
  clearToken,

  auth: {
    login: (identifier, password) => post('/auth/login', { identifier, password }),
    register: (data) => post('/auth/register', data),
    planRequest: (plan) => patch('/auth/plan-request', { plan }),
  },

  categories: {
    list: () => get('/categories'),
    create: (data) => post('/categories', data),
    update: (id, data) => put(`/categories/${id}`, data),
    delete: (id) => del(`/categories/${id}`),
  },

  products: {
    list: () => get('/products'),
    create: (data) => post('/products', data),
    update: (id, data) => put(`/products/${id}`, data),
    delete: (id) => del(`/products/${id}`),
  },

  cities: {
    list: () => get('/cities'),
    create: (data) => post('/cities', data),
    delete: (id) => del(`/cities/${id}`),
  },

  schools: {
    list: () => get('/schools'),
    create: (data) => post('/schools', data),
    delete: (id) => del(`/schools/${id}`),
  },

  lists: {
    list: () => get('/lists'),
    create: (data) => post('/lists', data),
    update: (id, data) => put(`/lists/${id}`, data),
    delete: (id) => del(`/lists/${id}`),
  },

  sales: {
    list: () => get('/sales'),
    create: (data) => post('/sales', data),
    togglePaid: (id) => patch(`/sales/${id}/paid`),
  },

  loyalty: {
    getSettings: () => get('/loyalty/settings'),
    updateSettings: (data) => put('/loyalty/settings', data),
    listCards: () => get('/loyalty/cards'),
    createCard: (data) => post('/loyalty/cards', data),
    updateCard: (id, data) => put(`/loyalty/cards/${id}`, data),
    adjustPoints: (id, delta) => patch(`/loyalty/cards/${id}/points`, { delta }),
    deleteCard: (id) => del(`/loyalty/cards/${id}`),
  },

  admin: {
    getStores: () => get('/admin/stores'),
    updateStore: (id, data) => put(`/admin/stores/${id}`, data),
    toggleStoreActive: (id) => patch(`/admin/stores/${id}/active`),
    deleteStore: (id) => del(`/admin/stores/${id}`),
    getSales: () => get('/admin/sales'),
    getCities: () => get('/admin/cities'),
    createCity: (data) => post('/admin/cities', data),
    deleteCity: (id) => del(`/admin/cities/${id}`),
    getSchools: () => get('/admin/schools'),
    createSchool: (data) => post('/admin/schools', data),
    deleteSchool: (id) => del(`/admin/schools/${id}`),
    getLists: () => get('/admin/lists'),
    saveList: (data) => post('/admin/lists', data),
    deleteList: (id) => del(`/admin/lists/${id}`),
  },
}

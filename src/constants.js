export const COLORS = [
  { hex: '#4F46E5', light: '#EEF2FF', mid: '#C7D2FE', name: 'Indigo' },
  { hex: '#0891B2', light: '#ECFEFF', mid: '#A5F3FC', name: 'Cyan' },
  { hex: '#D97706', light: '#FFFBEB', mid: '#FDE68A', name: 'Ambre' },
  { hex: '#DC2626', light: '#FEF2F2', mid: '#FECACA', name: 'Rouge' },
  { hex: '#7C3AED', light: '#F5F3FF', mid: '#DDD6FE', name: 'Violet' },
  { hex: '#059669', light: '#ECFDF5', mid: '#A7F3D0', name: 'Emerald' },
  { hex: '#DB2777', light: '#FDF2F8', mid: '#F9A8D4', name: 'Rose' },
  { hex: '#EA580C', light: '#FFF7ED', mid: '#FDBA74', name: 'Orange' },
]

export const PLANS = {
  gratuit:  { label: 'Gratuit',  monthly: 0,   annual: 0,    color: '#1D9E75', bg: '#E1F5EE' },
  standard: { label: 'Standard', monthly: 89,  annual: 899,  color: '#0C447C', bg: '#E6F1FB' },
  premium:  { label: 'Premium',  monthly: 149, annual: 1499, color: '#633806', bg: '#FAEEDA' },
}

export const PLAN_LIMITS = {
  gratuit:  { maxCategories: 3,        maxProductsPerCat: 3,        maxSchools: 2,        maxLists: 1,        maxLoyalty: 1,        analytics: false },
  standard: { maxCategories: Infinity, maxProductsPerCat: Infinity, maxSchools: 5,        maxLists: 20,       maxLoyalty: 5,        analytics: true  },
  premium:  { maxCategories: Infinity, maxProductsPerCat: Infinity, maxSchools: Infinity, maxLists: Infinity, maxLoyalty: Infinity, analytics: true  },
}

export const FREE_FEATURES = [
  'Caisse (POS)',
  'Max 3 catégories & 3 produits / catégorie',
  'Historique des ventes',
  'Max 2 écoles & 1 liste prête',
  '1 client fidélité',
]

export const STANDARD_FEATURES = [
  'Caisse (POS)',
  '6 catégories & 19 produits pré-configurés à l\'activation',
  'Catégories & produits illimités',
  'Historique des ventes',
  'Analytics & rapports',
  'Max 5 écoles & 20 listes prêtes',
  '5 clients fidélité',
]

export const PREMIUM_FEATURES = [
  'Caisse (POS)',
  '6 catégories & 19 produits pré-configurés à l\'activation',
  'Catégories & produits illimités',
  'Historique des ventes',
  'Analytics & rapports',
  'Écoles & listes illimitées',
  'Clients fidélité illimités',
]

export const GRADE_TEMPLATES = [
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème primaire', '1ère collège', '2ème collège', '3ème collège',
  'Tronc commun', '1 BAC SM', '1 BAC PC', '2 BAC SM', '2 BAC PC',
]

export const uid = () => Math.random().toString(36).slice(2, 10)

export const formatDate = (d = new Date()) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatTime = (d = new Date()) =>
  d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export const formatMoney = (n) => Number(n).toFixed(2)

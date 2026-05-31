import { PLANS } from '../constants.js'

const NAV_ITEMS = [
  { id: 'pos', icon: '🛒', key: 'pos' },
  { id: 'products', icon: '📦', key: 'products' },
  { id: 'lists', icon: '📋', key: 'lists' },
  { id: 'sales', icon: '💳', key: 'sales' },
  { id: 'loyalty', icon: '⭐', key: 'loyalty' },
  { id: 'analytics', icon: '📈', key: 'analytics' },
]

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
  { code: 'en', label: 'EN' },
]

export default function Layout({ t, lang, setLang, rtl, currentUser, storePage, setStorePage, logout, children }) {
  const planInfo = currentUser?.plan ? PLANS[currentUser.plan] : null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: rtl ? 'rtl' : 'ltr' }}>
      {/* Sidebar */}
      <nav style={{
        width: 72, background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 20, position: 'fixed',
        [rtl ? 'right' : 'left']: 0, top: 0, bottom: 0, zIndex: 100,
        boxShadow: rtl ? '-2px 0 12px rgba(0,0,0,0.15)' : '2px 0 12px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28, fontSize: 26 }}>📚</div>

        {/* Nav items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'center' }}>
          {NAV_ITEMS.map(item => {
            const active = storePage === item.id
            const locked = false
            return (
              <button key={item.id} onClick={() => !locked && setStorePage(item.id)} title={locked ? t('analyticsLocked') : t(item.key)} style={{
                width: 52, padding: '10px 0', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, border: 'none',
                cursor: locked ? 'not-allowed' : 'pointer',
                borderRadius: 10, transition: 'all 0.15s',
                background: active ? '#1D9E75' : 'transparent',
                color: active ? '#fff' : locked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
                opacity: locked ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {locked && <span style={{ fontSize: 8 }}>🔒</span>}
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.3px' }}>
                  {t(item.key).slice(0, 4).toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom: store name, plan, lang, logout */}
        <div style={{ width: '100%', padding: '0 8px 16px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {/* Store name */}
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser?.storeName}
          </div>
          {/* Plan badge */}
          {planInfo && (
            <div style={{
              background: planInfo.bg, color: planInfo.color,
              fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20, letterSpacing: '0.5px'
            }}>
              {planInfo.label.toUpperCase()}
            </div>
          )}
          {/* Lang toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', alignItems: 'center' }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: '3px 0', width: 40, border: 'none', borderRadius: 5,
                fontSize: 10, fontWeight: 700,
                background: lang === l.code ? '#1D9E75' : 'rgba(255,255,255,0.1)',
                color: '#fff', cursor: 'pointer',
              }}>{l.label}</button>
            ))}
          </div>
          {/* Logout */}
          <button onClick={logout} title={t('logout')} style={{
            width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(226,75,74,0.15)', color: '#E24B4A', fontSize: 18,
          }}>⏻</button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ [rtl ? 'marginRight' : 'marginLeft']: 72, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{
          background: '#fff', padding: '0 28px', height: 60, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1D2433' }}>{t(storePage)}</h1>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            })}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

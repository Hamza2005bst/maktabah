import { useState } from 'react'
import { PLANS, FREE_FEATURES, STANDARD_FEATURES, PREMIUM_FEATURES } from '../constants.js'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
  { code: 'en', label: 'EN' },
]

export default function Auth({ view, setView, login, register, t, lang, setLang, rtl }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1D2433 0%, #2d3a50 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: rtl ? 'rtl' : 'ltr',
    }}>
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 6 }}>
        {LANGS.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)} style={{
            padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600,
            background: lang === l.code ? '#1D9E75' : 'rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer',
          }}>{l.label}</button>
        ))}
      </div>

      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: view === 'register' ? 640 : 440, boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>📚</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1D2433' }}>Maktaba POS</div>
        </div>

        {view === 'login' ? (
          <LoginForm login={login} setView={setView} t={t} />
        ) : (
          <RegisterForm register={register} setView={setView} t={t} />
        )}
      </div>
    </div>
  )
}

function LoginForm({ login, setView, t }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(phone, password)
    setLoading(false)
    if (!result.ok) setError(t(result.error))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{t('phoneOrEmail')}</label>
        <input
          style={inputStyle} type="text" value={phone}
          onChange={e => setPhone(e.target.value)} placeholder="0612345678"
          autoFocus
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{t('password')}</label>
        <input
          style={inputStyle} type="password" value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <button type="submit" style={primaryBtnStyle} disabled={loading}>
        {loading ? '...' : t('loginBtn')}
      </button>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' }}>
        {t('noAccount')}{' '}
        <span onClick={() => setView('register')} style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 600 }}>
          {t('register')}
        </span>
      </div>
    </form>
  )
}

function RegisterForm({ register, setView, t }) {
  const [step, setStep] = useState(1)
  const [storeName, setStoreName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('')
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const validateStep1 = () => {
    const e = {}
    if (!storeName.trim()) e.storeName = t('required')
    if (!/^\d{10}$/.test(phone)) e.phone = t('phoneInvalid')
    if (password.length < 6) e.password = t('minPassword')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    if (!plan) { setErrors({ plan: t('required') }); return false }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleFinish = async () => {
    setRegLoading(true)
    setRegError('')
    const result = await register({ storeName, phone, password, plan })
    setRegLoading(false)
    if (!result || !result.ok) {
      setRegError(t(result?.error || 'serverError'))
      return
    }
    if (plan !== 'gratuit') setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1D2433', marginBottom: 12 }}>
          {t('requestSubmittedTitle')}
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 28, padding: '0 8px' }}>
          {t('requestPendingMsg')}
        </div>
        <button style={primaryBtnStyle} onClick={() => setView('login')}>
          {t('backToLogin')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: step >= n ? '#1D9E75' : '#E5E7EB',
              color: step >= n ? '#fff' : '#9CA3AF',
              transition: 'all 0.2s',
            }}>{n}</div>
            {n < 3 && <div style={{ width: 32, height: 2, background: step > n ? '#1D9E75' : '#E5E7EB', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16, color: '#1D2433' }}>{t('personalInfo')}</div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('storeName')}</label>
            <input style={{ ...inputStyle, ...(errors.storeName ? errorInputStyle : {}) }}
              value={storeName} onChange={e => setStoreName(e.target.value)} />
            {errors.storeName && <div style={fieldErrorStyle}>{errors.storeName}</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('phone')}</label>
            <input
              type="tel" inputMode="numeric"
              style={{ ...inputStyle, ...(errors.phone ? errorInputStyle : {}) }}
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(er => ({ ...er, phone: undefined })) }}
              placeholder="0612345678" maxLength={10}
            />
            {errors.phone && <div style={fieldErrorStyle}>{errors.phone}</div>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('password')}</label>
            <input type="password" style={{ ...inputStyle, ...(errors.password ? errorInputStyle : {}) }}
              value={password} onChange={e => setPassword(e.target.value)} />
            {errors.password && <div style={fieldErrorStyle}>{errors.password}</div>}
          </div>
          <button style={primaryBtnStyle} onClick={handleNext}>{t('next')}</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16, color: '#1D2433' }}>{t('choosePlan')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {['gratuit', 'standard', 'premium'].map(p => {
              const info = PLANS[p]
              const featuresMap = { gratuit: FREE_FEATURES, standard: STANDARD_FEATURES, premium: PREMIUM_FEATURES }
              const features = featuresMap[p]
              const selected = plan === p
              const priceLabel = info.monthly === 0 ? 'Gratuit' : `${info.monthly} DH/mois`
              return (
                <div key={p} onClick={() => { setPlan(p); setErrors({}) }} style={{
                  border: `2px solid ${selected ? info.color : '#E5E7EB'}`,
                  borderRadius: 12, padding: 14, cursor: 'pointer',
                  background: selected ? info.bg : '#fff',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#1D2433' }}>
                    {info.label}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: info.color, marginBottom: 2 }}>
                    {priceLabel}
                  </div>
                  {info.monthly > 0 && (
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 8 }}>ou {info.annual} DH/an</div>
                  )}
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {features.map((f, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>✓ {f}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {errors.plan && <div style={errorStyle}>{errors.plan}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={secondaryBtnStyle} onClick={() => setStep(1)}>{t('back')}</button>
            <button style={{ ...primaryBtnStyle, flex: 1 }} onClick={handleNext}>{t('next')}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16, color: '#1D2433' }}>{t('recap')}</div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 24, fontSize: 14 }}>
            <div style={{ marginBottom: 8 }}><strong>{t('storeName')} :</strong> {storeName}</div>
            <div style={{ marginBottom: 8 }}><strong>{t('phone')} :</strong> {phone}</div>
            <div>
              <strong>{t('plan')} :</strong>{' '}
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: PLANS[plan]?.bg || '#E5E7EB',
                color: PLANS[plan]?.color || '#374151',
              }}>{PLANS[plan]?.label}</span>
            </div>
          </div>
          {regError && <div style={errorStyle}>{regError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={secondaryBtnStyle} onClick={() => setStep(2)} disabled={regLoading}>{t('back')}</button>
            <button style={{ ...primaryBtnStyle, flex: 1 }} onClick={handleFinish} disabled={regLoading}>
              {regLoading ? '...' : t('finish')}
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' }}>
        {t('hasAccount')}{' '}
        <span onClick={() => setView('login')} style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 600 }}>
          {t('login')}
        </span>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 8,
  border: '1.5px solid #D1D5DB', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s',
}
const errorInputStyle = { borderColor: '#E24B4A' }
const errorStyle = {
  background: '#FCEBEB', color: '#791F1F', borderRadius: 8,
  padding: '10px 14px', fontSize: 14, marginBottom: 14,
}
const fieldErrorStyle = { color: '#E24B4A', fontSize: 12, marginTop: 4 }
const primaryBtnStyle = {
  width: '100%', padding: '11px 0', background: '#1D9E75', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  transition: 'opacity 0.15s',
}
const secondaryBtnStyle = {
  padding: '11px 20px', background: '#F3F4F6', color: '#374151',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
}

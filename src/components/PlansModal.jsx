import { PLANS, FREE_FEATURES, STANDARD_FEATURES, PREMIUM_FEATURES } from '../constants.js'

const PLAN_FEATURES = {
  gratuit:  FREE_FEATURES,
  standard: STANDARD_FEATURES,
  premium:  PREMIUM_FEATURES,
}

function PriceDisplay({ info }) {
  if (info.monthly === 0) return <span>Gratuit</span>
  return (
    <div style={{ fontWeight: 800 }}>{info.annual} DH/an</div>
  )
}

export default function PlansModal({ currentUser, onChangePlan, onClose }) {
  const currentPlan = currentUser?.plan || 'gratuit'
  const pendingPlan = currentUser?.pendingPlan || null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 36, maxWidth: 720, width: '95%',
        boxShadow: '0 12px 60px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#1D2433', marginBottom: 6 }}>Nos plans</div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>Sélectionnez le plan qui correspond à vos besoins</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {['gratuit', 'standard', 'premium'].map(p => {
            const info = PLANS[p]
            const isCurrent = p === currentPlan
            const features = PLAN_FEATURES[p]
            return (
              <div key={p} style={{
                border: `2px solid ${isCurrent ? info.color : '#E5E7EB'}`,
                borderRadius: 14, padding: 20,
                background: isCurrent ? info.bg : '#FAFAFA',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}>
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    background: info.color, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    Plan actuel
                  </div>
                )}

                <div style={{ fontWeight: 700, fontSize: 16, color: '#1D2433', marginBottom: 4 }}>
                  {info.label}
                </div>
                <div style={{ fontWeight: 800, fontSize: 22, color: info.color, marginBottom: 14, lineHeight: 1.2 }}>
                  <PriceDisplay info={info} />
                </div>

                <div style={{ fontSize: 12, color: '#555', flex: 1, marginBottom: 16 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ color: info.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div style={{
                    textAlign: 'center', fontSize: 12, fontWeight: 700,
                    color: info.color, padding: '8px 0',
                    border: `1px solid ${info.color}`, borderRadius: 8, background: '#fff',
                  }}>
                    Plan actif
                  </div>
                ) : p === pendingPlan ? (
                  <div style={{
                    textAlign: 'center', fontSize: 12, fontWeight: 700,
                    color: '#7C3AED', padding: '8px 0',
                    border: '1px solid #7C3AED', borderRadius: 8, background: '#F5F3FF',
                  }}>
                    ⏳ En attente d'approbation
                  </div>
                ) : (
                  <button onClick={() => onChangePlan(p)} disabled={!!pendingPlan} style={{
                    width: '100%', padding: '10px 0',
                    background: pendingPlan ? '#E5E7EB' : info.color,
                    color: pendingPlan ? '#9CA3AF' : '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: pendingPlan ? 'not-allowed' : 'pointer',
                  }}>
                    Choisir ce plan
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: '11px 0', background: '#F3F4F6', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151',
        }}>
          Fermer
        </button>
      </div>
    </div>
  )
}

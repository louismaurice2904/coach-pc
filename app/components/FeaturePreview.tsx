'use client'

interface FeaturePreviewProps {
  ouvert: boolean
  onClose: () => void
  children: React.ReactNode
  titre: string
}

export function FeaturePreview({ ouvert, onClose, children, titre }: FeaturePreviewProps) {
  if (!ouvert) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0c1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
        padding: 32, maxWidth: 460, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 8, width: 32, height: 32, color: 'rgba(255,255,255,0.5)',
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          ×
        </button>
        <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
          APERÇU
        </p>
        <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {titre}
        </h3>
        {children}
      </div>
    </div>
  )
}
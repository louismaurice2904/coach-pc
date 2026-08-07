'use client'

import { useState } from 'react'
import Link from 'next/link'

export function usePremiumCheck(isPremium: boolean) {
  const [showModal, setShowModal] = useState(false)

  const checkAccess = (action: () => void) => {
    if (isPremium) {
      action()
    } else {
      setShowModal(true)
    }
  }

  const PremiumModal = () => {
    if (!showModal) return null
    return (
      <div
        onClick={() => setShowModal(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeInOverlay 0.3s ease'
        }}
      >
        <style>{`
          @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
          @keyframes shimmerCrown { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.1) rotate(-5deg)} }
        `}</style>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
            border: '1px solid rgba(167,139,250,0.4)',
            borderRadius: 24, padding: 40, maxWidth: 420, textAlign: 'center',
            boxShadow: '0 0 60px rgba(139,92,246,0.4)',
            animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16, animation: 'shimmerCrown 2s ease-in-out infinite' }}>👑</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            Fonctionnalité Premium
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
            Cette fonctionnalité fait partie de l'abonnement Premium. Débloque l'accès complet à Novalys pour 9€/mois, soit 18x moins cher qu'un prof particulier.
          </p>
          <Link href="/#tarifs" style={{
            display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 15,
            padding: '14px 32px', borderRadius: 14, textDecoration: 'none',
            background: 'linear-gradient(135deg, #7dd3fc, #ec4899)',
            boxShadow: '0 0 30px rgba(167,139,250,0.5)', fontFamily: 'Inter, sans-serif'
          }}>
            Découvrir Premium →
          </Link>
          <button onClick={() => setShowModal(false)} style={{
            display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>
            Plus tard
          </button>
        </div>
      </div>
    )
  }

  return { checkAccess, PremiumModal, isPremiumLocked: !isPremium }
}
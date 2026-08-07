'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnexion = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage('Email ou mot de passe incorrect.') }
    else { window.location.href = '/aujourdhui' }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 30px rgba(99,102,241,0.4); transition: all 0.3s; border: none; cursor: pointer; }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.7); transform: scale(1.05); }
        input {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; border-radius: 12px; padding: 12px 16px;
          width: 100%; outline: none; font-size: 14px; transition: border 0.2s; font-family: inherit;
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ color: 'white', fontWeight: 900, fontSize: 24, textDecoration: 'none', letterSpacing: '-0.5px' }}>
            Coach<span style={{ color: '#38bdf8' }}>PC</span>
          </Link>
        </div>

        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 6 }}>Content de te revoir</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Connecte-toi pour continuer à réviser</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>EMAIL</label>
              <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnexion()} />
            </div>
          </div>

          <button onClick={handleConnexion} disabled={loading} className="glow-btn" style={{
            width: '100%', color: 'white', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14
          }}>
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>

          {message && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 13, textAlign: 'center'
            }}>{message}</div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            Pas encore de compte ?{' '}
            <Link href="/inscription" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
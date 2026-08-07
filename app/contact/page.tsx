'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Contact() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')

  const handleEnvoyer = async () => {
    if (!nom || !email || !contenu) { setMessage('Remplis tous les champs.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('messages').insert({
      user_id: user?.id ?? null,
      nom, email, contenu, lu: false
    })
    if (error) { setMessage('Erreur : ' + error.message) }
    else { setDone(true) }
    setLoading(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#070b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 48,
        textAlign: 'center', maxWidth: 440, width: '100%', margin: '0 24px'
      }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 8 }}>Message envoyé !</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}>
          Je te répondrai dans les plus brefs délais.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 30px rgba(99,102,241,0.4); transition: all 0.3s; border: none; cursor: pointer; }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.7); transform: scale(1.05); }
        input, textarea {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; border-radius: 12px; padding: 12px 16px;
          width: 100%; outline: none; font-size: 14px; transition: border 0.2s; font-family: inherit;
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>💬</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 8 }}>Nous contacter</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.7 }}>
              Une question ? Un bug ? Une suggestion ?<br />Je réponds personnellement à chaque message.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TON PRÉNOM</label>
              <input type="text" placeholder="Emma" value={nom} onChange={e => setNom(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TON EMAIL</label>
              <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TON MESSAGE</label>
              <textarea placeholder="Écris ton message ici..." value={contenu} onChange={e => setContenu(e.target.value)} rows={6} style={{ resize: 'none' }} />
            </div>
          </div>

          <button onClick={handleEnvoyer} disabled={loading} className="glow-btn" style={{
            width: '100%', color: 'white', fontWeight: 700, fontSize: 15,
            padding: '14px', borderRadius: 14, marginTop: 24
          }}>
            {loading ? 'Envoi...' : 'Envoyer mon message →'}
          </button>

          {message && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 13, textAlign: 'center'
            }}>{message}</div>
          )}
        </div>
      </div>
    </div>
  )
}
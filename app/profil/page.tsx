'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Profil() {
  const [classe, setClasse] = useState('')
  const [objectif, setObjectif] = useState('')
  const [temps, setTemps] = useState('')
  const [dateBac, setDateBac] = useState('')
  const [prenom, setPrenom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      if (data) {
        setClasse(data.classe || '')
        setObjectif(data.objectif_note?.toString() || '')
        setTemps(data.temps_semaine?.toString() || '')
        setDateBac(data.date_bac || '')
        setPrenom(data.prenom || '')
      }
    }
    fetchProfil()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Tu dois être connecté.'); setLoading(false); return }
    const { error } = await supabase.from('profils').upsert({
      user_id: user.id, prenom, classe,
      objectif_note: parseInt(objectif),
      temps_semaine: parseInt(temps),
      date_bac: dateBac,
    })
    if (error) { setMessage('Erreur : ' + error.message) }
    else { setMessage('✅ Profil enregistré !') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 30px rgba(99,102,241,0.4); transition: all 0.3s; border: none; cursor: pointer; }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.7); transform: scale(1.05); }
        input, select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; border-radius: 12px; padding: 12px 16px;
          width: 100%; outline: none; font-size: 14px; transition: border 0.2s; font-family: inherit;
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, select:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        select option { background: #0f172a; color: white; }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
            }}>🎓</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>Mon profil</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Ces informations personnalisent ton expérience</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'Prénom', comp: <input type="text" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} /> },
              { label: 'Classe', comp: <select value={classe} onChange={e => setClasse(e.target.value)}><option value="">Choisir...</option><option value="Seconde">Seconde</option><option value="Première">Première</option><option value="Terminale">Terminale</option></select> },
              { label: 'Note visée au bac (sur 20)', comp: <input type="number" min="0" max="20" placeholder="Ex : 16" value={objectif} onChange={e => setObjectif(e.target.value)} /> },
              { label: 'Temps de travail par semaine (heures)', comp: <input type="number" min="1" placeholder="Ex : 5" value={temps} onChange={e => setTemps(e.target.value)} /> },
              { label: 'Date du bac', comp: <input type="date" value={dateBac} onChange={e => setDateBac(e.target.value)} /> },
            ].map(({ label, comp }) => (
              <div key={label}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  {label.toUpperCase()}
                </label>
                {comp}
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={loading} className="glow-btn" style={{
            width: '100%', color: 'white', fontWeight: 700, fontSize: 14,
            padding: '14px', borderRadius: 14, marginTop: 28
          }}>
            {loading ? 'Enregistrement...' : 'Enregistrer mon profil →'}
          </button>

          {message && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: message.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${message.includes('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: message.includes('✅') ? '#86efac' : '#fca5a5', fontSize: 13, textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
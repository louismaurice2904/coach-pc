'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Bienvenue() {
  const [prenom, setPrenom] = useState('')
  const [classe, setClasse] = useState('')
  const [objectif, setObjectif] = useState('')
  const [temps, setTemps] = useState('')
  const [dateBac, setDateBac] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }

      const { data: profil } = await supabase.from('profils').select('prenom, classe').eq('user_id', user.id).single()
      if (profil?.prenom && profil?.classe) {
        window.location.href = '/dashboard'
      }
    }
    check()
  }, [])

  const handleValider = async () => {
    if (!prenom || !classe) {
      setMessage('Le prénom et la classe sont indispensables pour continuer.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const finEssai = new Date()
    finEssai.setDate(finEssai.getDate() + 7)

    const { error } = await supabase.from('profils').upsert({
      user_id: user.id,
      prenom,
      classe,
      objectif_note: objectif ? parseInt(objectif) : null,
      temps_semaine: temps ? parseInt(temps) : null,
      date_bac: classe === 'Terminale' ? dateBac : null,
      premium: true,
      essai_premium_fin: finEssai.toISOString(),
      essai_utilise: true,
    }, { onConflict: 'user_id' })

    if (error) {
      setMessage('Erreur : ' + error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.025); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .btn-primary { background: #fff; color: #070b18; transition: opacity 0.2s ease; border: none; cursor: pointer; }
        .btn-primary:hover { opacity: 0.85; }
        input, select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; border-radius: 12px; padding: 12px 16px;
          width: 100%; outline: none; font-size: 14px; transition: border 0.2s; font-family: inherit;
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, select:focus { border-color: rgba(56,189,248,0.6) !important; }
        select option { background: #0c1120; color: white; }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 480, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 8 }}>Avant de commencer</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
              Quelques infos pour que Novalys s'adapte vraiment à toi.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>PRÉNOM *</label>
              <input type="text" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>CLASSE *</label>
              <select value={classe} onChange={e => setClasse(e.target.value)}>
                <option value="">Choisir...</option>
                <option value="Seconde">Seconde</option>
                <option value="Première">Première</option>
                <option value="Terminale">Terminale</option>
              </select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>NOTE VISÉE (SUR 20)</label>
              <input type="number" min="0" max="20" placeholder="Ex : 16" value={objectif} onChange={e => setObjectif(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>TEMPS DE TRAVAIL / SEMAINE (H)</label>
              <input type="number" min="1" placeholder="Ex : 5" value={temps} onChange={e => setTemps(e.target.value)} />
            </div>
            {classe === 'Terminale' && (
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>DATE DU BAC</label>
                <input type="date" value={dateBac} onChange={e => setDateBac(e.target.value)} />
              </div>
            )}
          </div>

          <button onClick={handleValider} disabled={loading} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14, marginTop: 28,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Enregistrement...' : 'Commencer avec Novalys →'}
          </button>

          {message && <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#fca5a5' }}>{message}</p>}
        </div>
      </div>
    </div>
  )
}
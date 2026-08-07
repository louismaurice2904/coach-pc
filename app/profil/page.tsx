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
  const [premium, setPremium] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)

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
        setPremium(data.premium || false)
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get('paiement') === 'succes') {
        setMessage('✅ Paiement réussi ! Ton compte Premium sera activé dans quelques secondes.')
        setTimeout(() => window.location.reload(), 3000)
      }
    }
    fetchProfil()
  }, [])

  const handlePassPremium = async () => {
    setLoadingCheckout(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Tu dois être connecté.'); setLoadingCheckout(false); return }

    try {
      const res = await fetch('/api/creer-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage('Erreur lors de la création du paiement.')
      }
    } catch {
      setMessage('Erreur de connexion.')
    }
    setLoadingCheckout(false)
  }

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
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
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

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* Statut Premium */}
        <div className="glass" style={{
          borderRadius: 16, padding: 20, marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>STATUT</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
              {premium ? '👑 Compte Premium' : 'Compte Gratuit'}
            </p>
          </div>
          {!premium && (
            <button onClick={handlePassPremium} disabled={loadingCheckout} className="btn-primary" style={{
              fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 10,
              opacity: loadingCheckout ? 0.6 : 1
            }}>
              {loadingCheckout ? 'Chargement...' : 'Passer Premium →'}
            </button>
          )}
        </div>

        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
            }}>🎓</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 6 }}>Mon profil</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Ces informations personnalisent ton expérience</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>PRÉNOM</label>
              <input type="text" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>CLASSE</label>
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
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>DATE DU BAC</label>
              <input type="date" value={dateBac} onChange={e => setDateBac(e.target.value)} />
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 14, padding: '14px', borderRadius: 14, marginTop: 28,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Enregistrement...' : 'Enregistrer mon profil →'}
          </button>

          {message && <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: message.includes('✅') ? '#86efac' : '#fca5a5' }}>{message}</p>}

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
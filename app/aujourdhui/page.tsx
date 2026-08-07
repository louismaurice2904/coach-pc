'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Aujourdhui() {
  const [loading, setLoading] = useState(true)
  const [recommandation, setRecommandation] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [prenom, setPrenom] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }

      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      const { data: progData } = await supabase.from('progression_chapitres').select('*').eq('user_id', user.id)

      if (p) setPrenom(p.prenom || '')

      const progressions: Record<string, any> = {}
      if (progData) progData.forEach((item: any) => { progressions[item.chapitre] = item })

      let joursAvantBac = null
      if (p?.date_bac) {
        joursAvantBac = Math.ceil((new Date(p.date_bac).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }

      try {
        const res = await fetch('/api/programme-du-jour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cours: c || [],
            progressions,
            tempsDisponible: p?.temps_semaine ? Math.round((p.temps_semaine * 60) / 5) : 30,
            joursAvantBac
          })
        })
        const data = await res.json()
        if (data.recommandation) {
          setRecommandation(data.recommandation)
        } else {
          setMessage(data.message)
        }
      } catch {
        setMessage('Erreur lors du calcul de ton programme.')
      }
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 30px rgba(99,102,241,0.4);transition:all 0.3s;border:none;cursor:pointer}
        .glow-btn:hover{box-shadow:0 0 50px rgba(99,102,241,0.7);transform:scale(1.05)}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>
            Salut {prenom || ''} 👋
          </h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
              Préparation de ton programme...
            </p>
          </div>
        ) : recommandation ? (
          <div>
            <div className="glass" style={{ borderRadius: 28, padding: 36, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>
                {recommandation.type === 'fiche' ? '📚' : '✏️'}
              </div>
              <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                TON PROGRAMME DU JOUR
              </p>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 24, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                {recommandation.chapitre}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                {recommandation.raison}
              </p>
              {recommandation.urgence && (
                <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, marginTop: 12, fontFamily: 'Inter, sans-serif' }}>
                  ⏰ {recommandation.urgence}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, marginBottom: 28 }}>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  ⏱ ~{recommandation.dureeEstimee} min
                </span>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  {recommandation.type === 'fiche' ? '📋 Fiche de révision' : '✏️ Exercices'}
                </span>
              </div>

              <Link
                href={recommandation.type === 'fiche' ? '/fiche' : '/exercices'}
                className="glow-btn"
                style={{
                  display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 16,
                  padding: '16px 40px', borderRadius: 16, textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                C'est parti →
              </Link>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                Voir mon tableau de bord complet →
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: 28, padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🚀</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
            <Link href="/cours" className="glow-btn" style={{
              display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 15,
              padding: '14px 28px', borderRadius: 14, textDecoration: 'none', marginTop: 20,
              fontFamily: 'Inter, sans-serif'
            }}>
              Importer un cours →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const chapitres = [
  'Cinétique chimique', 'Équilibres acido-basiques', 'Électrochimie',
  'Mécanique', 'Thermodynamique', 'Ondes', 'Optique',
  'Structure de la matière', 'Réactions nucléaires', 'Chimie organique',
  'Spectroscopie', 'Électromagnétisme'
]

function genererPlanning(tempsSemaine: number, cours: any[]) {
  const heuresParJour = Math.round((tempsSemaine / 5) * 10) / 10
  const chapitresARevoir = cours.length > 0 ? cours.map(c => c.chapitre) : chapitres.slice(0, 3)
  return jours.map((jour, i) => {
    if (i >= 5) return { jour, repos: true, seances: [] }
    const chapitre = chapitresARevoir[i % chapitresARevoir.length]
    return {
      jour, repos: false,
      seances: [
        { type: 'Révision cours', duree: Math.round(heuresParJour * 0.4 * 60), chapitre },
        { type: 'Exercices', duree: Math.round(heuresParJour * 0.6 * 60), chapitre },
      ]
    }
  })
}

export default function Planning() {
  const [profil, setProfil] = useState<any>(null)
  const [cours, setCours] = useState<any[]>([])
  const [planning, setPlanning] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (p) setProfil(p)
      if (c) setCours(c)
      setPlanning(genererPlanning(p?.temps_semaine || 5, c || []))
    }
    fetch()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060d2e' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 30px rgba(99,102,241,0.4); transition: all 0.3s; border: none; cursor: pointer; }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.7); transform: scale(1.05); }
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }} className="no-print">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>📅 Mon planning</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {profil ? `Basé sur ${profil.temps_semaine}h de travail par semaine` : 'Chargement...'}
            </p>
          </div>
          <button onClick={() => window.print()} className="glow-btn no-print" style={{
            color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 20px', borderRadius: 12
          }}>
            🖨️ Imprimer
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planning.map(jour => (
            <div key={jour.jour} className="glass card-hover" style={{
              borderRadius: 20, overflow: 'hidden',
              opacity: jour.repos ? 0.5 : 1
            }}>
              <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: jour.repos ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  {jour.repos ? '😴' : '📖'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{jour.jour}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {jour.repos ? 'Repos mérité' : `${jour.seances.reduce((a: number, s: any) => a + s.duree, 0)} min de travail`}
                  </p>
                </div>
              </div>

              {!jour.repos && (
                <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {jour.seances.map((seance: any, i: number) => (
                    <div key={i} style={{
                      borderRadius: 12, padding: '12px 16px',
                      background: i === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                      border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.25)'}`
                    }}>
                      <p style={{ color: i === 0 ? '#60a5fa' : '#a78bfa', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{seance.type.toUpperCase()}</p>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{seance.chapitre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>⏱ {seance.duree} min</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 20, borderRadius: 16, padding: '16px 20px',
          background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)'
        }}>
          <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>💡 COMMENT EST CALCULÉ TON PLANNING ?</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7 }}>
            Ton planning est généré selon ton temps de travail hebdomadaire et les chapitres importés. Il s'adapte automatiquement à ta progression.
          </p>
        </div>
      </div>
    </div>
  )
}
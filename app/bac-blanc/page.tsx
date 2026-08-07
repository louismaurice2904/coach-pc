'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BacBlanc() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [sujet, setSujet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showCorrection, setShowCorrection] = useState<Record<string, boolean>>({})
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('niveau_scolaire, premium').eq('user_id', user.id).single()
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
      setIsPremium(profil?.premium || false)
    }
    init()
  }, [])

  const titrePage = niveauScolaire === 'Terminale' ? 'Bac Blanc' : 'Contrôle Blanc'

  const toggleChapitre = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const genererSujet = async () => {
    if (selected.length === 0) { toast('Sélectionne au moins un chapitre', 'error'); return }
    setLoading(true)
    setSujet(null)
    setShowCorrection({})

    const chapitresSelectionnes = cours.filter(c => selected.includes(c.id))

    try {
      const res = await fetch('/api/generer-bac-blanc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapitres: chapitresSelectionnes, niveauScolaire })
      })
      const data = await res.json()
      if (data.error) {
        toast('Erreur lors de la génération', 'error')
      } else {
        setSujet(data)
        toast('Sujet généré ✅', 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const toggleCorrection = (key: string) => {
    setShowCorrection(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 30px rgba(99,102,241,0.4);transition:all 0.3s;border:none;cursor:pointer}
        .glow-btn:hover{box-shadow:0 0 50px rgba(99,102,241,0.7);transform:scale(1.05)}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media print{
          nav,.no-print{display:none!important}
          body{background:white!important;color:black!important}
        }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
              📝 {titrePage}
            </h1>
            {!isPremium && (
              <span style={{ background: 'rgba(167,139,250,0.15)', outline: '1px solid rgba(167,139,250,0.4)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
                👑 PREMIUM
              </span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
            Génère un sujet complet type contrôle, format officiel, sur les chapitres de ton choix.
          </p>

          <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              CHAPITRES À INCLURE (sélectionne 1 à 3)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {cours.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
              ) : cours.map(c => (
                <button key={c.id} onClick={() => toggleChapitre(c.id)} style={{
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  background: selected.includes(c.id) ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.04)',
                  color: selected.includes(c.id) ? 'white' : 'rgba(255,255,255,0.6)',
                  outline: selected.includes(c.id) ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span>{selected.includes(c.id) ? '☑️' : '⬜'}</span>
                  {c.chapitre}
                </button>
              ))}
            </div>

            <button onClick={() => checkAccess(genererSujet)} disabled={loading || selected.length === 0} className="glow-btn" style={{
              width: '100%', color: 'white', fontWeight: 700, fontSize: 15, padding: '14px',
              borderRadius: 14, fontFamily: 'Inter, sans-serif',
              opacity: loading || selected.length === 0 ? 0.5 : 1
            }}>
              {loading ? '🤖 Génération du sujet...' : `✨ Générer mon ${titrePage.toLowerCase()}`}
            </button>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.2)', borderTop: '2px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                  Ça peut prendre 20-30 secondes...
                </p>
              </div>
            )}
          </div>
        </div>

        {sujet && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => window.print()} className="glow-btn" style={{
                color: 'white', fontWeight: 700, fontSize: 13, padding: '10px 20px',
                borderRadius: 10, fontFamily: 'Inter, sans-serif'
              }}>
                🖨️ Imprimer le sujet
              </button>
            </div>

            <div className="glass" style={{ borderRadius: 20, padding: 32, marginBottom: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{sujet.titre}</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Durée : {sujet.duree} · {niveauScolaire}</p>
              </div>

              {sujet.exercices.map((ex: any) => (
                <div key={ex.numero} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>
                      Exercice {ex.numero} — {ex.titre}
                    </h3>
                    <span style={{ background: 'rgba(99,102,241,0.15)', outline: '1px solid rgba(99,102,241,0.3)', color: '#7dd3fc', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
                      {ex.points} points
                    </span>
                  </div>

                  {ex.questions.map((q: any) => {
                    const key = `${ex.numero}-${q.numero}`
                    return (
                      <div key={q.numero} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                          <strong>{q.numero}.</strong> {q.enonce} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>({q.points} pts)</span>
                        </p>
                        <button onClick={() => toggleCorrection(key)} className="no-print" style={{
                          background: 'none', border: 'none', color: '#38bdf8', fontSize: 12,
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600
                        }}>
                          {showCorrection[key] ? '▲ Cacher la correction' : '▼ Voir la correction'}
                        </button>
                        {showCorrection[key] && (
                          <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', outline: '1px solid rgba(34,197,94,0.2)' }}>
                            <p style={{ color: '#86efac', fontSize: 12, fontWeight: 700, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>✓ CORRECTION</p>
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{q.correction}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
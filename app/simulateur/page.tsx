'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DUREE_TOTALE = 30 * 60 // 30 minutes en secondes

export default function Simulateur() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [sujet, setSujet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(DUREE_TOTALE)
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [termine, setTermine] = useState(false)
  const [showCorrection, setShowCorrection] = useState<Record<string, boolean>>({})
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [userId, setUserId] = useState<string | null>(null)
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('premium, niveau_scolaire').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
    }
    init()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (enCours && tempsRestant > 0) {
      intervalRef.current = setInterval(() => {
        setTempsRestant(prev => {
          if (prev <= 1) {
            terminerSimulation()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }
  }, [enCours])

  const toggleChapitre = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const genererSujet = async () => {
    if (selected.length === 0) { toast('Sélectionne au moins un chapitre', 'error'); return }
    setLoading(true)
    const chapitresSelectionnes = cours.filter(c => selected.includes(c.id))

    try {
      const res = await fetch('/api/generer-bac-blanc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapitres: chapitresSelectionnes, niveauScolaire, userId })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setSujet(data)
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const demarrerSimulation = () => {
    setEnCours(true)
    setTempsRestant(DUREE_TOTALE)
    setReponses({})
    setTermine(false)
    startTimeRef.current = Date.now()
  }

  const terminerSimulation = async () => {
    setEnCours(false)
    setTermine(true)
    if (intervalRef.current) clearInterval(intervalRef.current)

    const dureeSec = Math.round((Date.now() - startTimeRef.current) / 1000)
    const nbQuestionsRepondues = Object.keys(reponses).length
    const nbQuestionsTotal = sujet.exercices.reduce((acc: number, ex: any) => acc + ex.questions.length, 0)
    const scoreEstime = Math.round((nbQuestionsRepondues / Math.max(nbQuestionsTotal, 1)) * 100)

    if (userId) {
      await supabase.from('simulations_examen').insert({
        user_id: userId,
        chapitres: cours.filter(c => selected.includes(c.id)).map(c => c.chapitre).join(', '),
        score: scoreEstime,
        duree_secondes: dureeSec,
        date_simulation: new Date().toISOString().split('T')[0]
      })
    }
  }

  const formatTemps = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleCorrection = (key: string) => {
    setShowCorrection(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const urgence = tempsRestant < 300 // moins de 5 minutes

  return (
    <div style={{ minHeight: '100vh', background: enCours ? '#050810' : '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:14px;width:100%;outline:none;font-size:14px;font-family:Inter,sans-serif;resize:vertical;line-height:1.7}
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(56,189,248,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes urgentPulse{0%,100%{color:#fca5a5}50%{color:#ef4444}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      {!enCours && <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {!enCours && !termine && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
                ⏱️ Simulateur jour J
              </h1>
              {!isPremium && (
                <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
                  👑 PREMIUM
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
              Reproduis les conditions réelles du bac : 30 minutes chrono, pas de retour en arrière, correction uniquement à la fin.
            </p>

            {!sujet ? (
              <div className="glass" style={{ borderRadius: 20, padding: 24 }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                  CHAPITRES À INCLURE
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {cours.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
                  ) : cours.map(c => (
                    <button key={c.id} onClick={() => toggleChapitre(c.id)} style={{
                      padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                      background: selected.includes(c.id) ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                      color: selected.includes(c.id) ? 'white' : 'rgba(255,255,255,0.6)',
                      outline: selected.includes(c.id) ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <span>{selected.includes(c.id) ? '☑️' : '⬜'}</span>
                      {c.chapitre}
                    </button>
                  ))}
                </div>
                <button onClick={() => checkAccess(genererSujet)} disabled={loading || selected.length === 0} className="btn-primary" style={{
                  width: '100%', fontWeight: 700, fontSize: 15, padding: '14px',
                  borderRadius: 14, fontFamily: 'Inter, sans-serif',
                  opacity: loading || selected.length === 0 ? 0.5 : 1
                }}>
                  {loading ? '🤖 Préparation du sujet...' : 'Préparer le sujet →'}
                </button>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: 20, padding: 32, textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>⏱️</p>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Sujet prêt</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  30 minutes chrono. Une fois lancé, tu ne pourras plus revenir en arrière ni voir les corrections avant la fin.
                </p>
                <button onClick={demarrerSimulation} className="btn-primary" style={{
                  fontWeight: 700, fontSize: 16, padding: '16px 40px', borderRadius: 14, fontFamily: 'Inter, sans-serif'
                }}>
                  Démarrer la simulation →
                </button>
              </div>
            )}
          </>
        )}

        {enCours && sujet && (
          <div>
            <div style={{
              position: 'sticky', top: 0, zIndex: 10, background: '#050810', padding: '16px 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                {Object.keys(reponses).length} / {sujet.exercices.reduce((acc: number, ex: any) => acc + ex.questions.length, 0)} répondues
              </p>
              <p style={{
                fontSize: 24, fontWeight: 900, fontFamily: 'monospace',
                color: urgence ? '#ef4444' : '#38bdf8',
                animation: urgence ? 'urgentPulse 1s ease-in-out infinite' : 'none'
              }}>
                {formatTemps(tempsRestant)}
              </p>
            </div>

            {sujet.exercices.map((ex: any) => (
              <div key={ex.numero} className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                  Exercice {ex.numero} — {ex.titre} ({ex.points} pts)
                </h3>
                {ex.questions.map((q: any) => (
                  <div key={q.numero} style={{ marginBottom: 16 }}>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                      <strong>{q.numero}.</strong> {q.enonce}
                    </p>
                    <textarea
                      rows={3}
                      placeholder="Ta réponse..."
                      value={reponses[`${ex.numero}-${q.numero}`] || ''}
                      onChange={e => setReponses(prev => ({ ...prev, [`${ex.numero}-${q.numero}`]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            ))}

            <button onClick={terminerSimulation} className="btn-primary" style={{
              width: '100%', fontWeight: 700, fontSize: 15, padding: '16px', borderRadius: 14, fontFamily: 'Inter, sans-serif'
            }}>
              Rendre ma copie →
            </button>
          </div>
        )}

        {termine && sujet && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="glass" style={{ borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🏁</p>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Simulation terminée</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Voici les corrections détaillées, exercice par exercice.
              </p>
            </div>

            {sujet.exercices.map((ex: any) => (
              <div key={ex.numero} className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                  Exercice {ex.numero} — {ex.titre}
                </h3>
                {ex.questions.map((q: any) => {
                  const key = `${ex.numero}-${q.numero}`
                  return (
                    <div key={q.numero} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                        <strong>{q.numero}.</strong> {q.enonce}
                      </p>
                      {reponses[key] && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>TA RÉPONSE</p>
                          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{reponses[key]}</p>
                        </div>
                      )}
                      <button onClick={() => toggleCorrection(key)} style={{
                        background: 'none', border: 'none', color: '#38bdf8', fontSize: 12,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600
                      }}>
                        {showCorrection[key] ? '▲ Cacher' : '▼ Voir la correction'}
                      </button>
                      {showCorrection[key] && (
                        <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)' }}>
                          <p style={{ color: '#86efac', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>✓ CORRECTION</p>
                          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>{q.correction}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            <button onClick={() => { setSujet(null); setTermine(false); setSelected([]) }} className="btn-primary" style={{
              width: '100%', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14, marginTop: 12
            }}>
              Nouvelle simulation →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
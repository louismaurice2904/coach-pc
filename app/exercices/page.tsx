'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Exercice = {
  id: number
  type: 'qcm' | 'ouvert' | 'calcul'
  question: string
  options?: string[]
  reponse?: number
  reponse_attendue?: string
  explication: string
}

export default function Exercices() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [exercices, setExercices] = useState<Exercice[]>([])
  const [loading, setLoading] = useState(false)
  const [niveau, setNiveau] = useState<'facile' | 'intermédiaire' | 'difficile'>('intermédiaire')
  const [reponses, setReponses] = useState<Record<number, any>>({})
  const [reponsesOuvertes, setReponsesOuvertes] = useState<Record<number, string>>({})
  const [valide, setValide] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (data) setCours(data)
    }
    init()
  }, [])

  const genererExercices = async () => {
    if (!selected) { toast('Sélectionne un chapitre', 'error'); return }
    setLoading(true)
    setExercices([])
    setReponses({})
    setReponsesOuvertes({})
    setValide(false)
    setScore(0)

    try {
      const res = await fetch('/api/generer-exercices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapitre: selected.chapitre,
          contenu: selected.contenu,
          niveau
        })
      })
      const data = await res.json()
      if (data.error) {
        toast('Erreur lors de la génération', 'error')
      } else {
        setExercices(data.exercices || [])
        toast(`5 exercices générés ✅`, 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const handleQCM = (exId: number, index: number) => {
    if (valide) return
    setReponses(prev => ({ ...prev, [exId]: index }))
  }

  const handleValider = () => {
    let s = 0
    exercices.forEach(ex => {
      if (ex.type === 'qcm' && reponses[ex.id] === ex.reponse) s++
    })
    setScore(s)
    setValide(true)
    toast(`Score : ${s}/${exercices.filter(e => e.type === 'qcm').length} ✅`, 'success')
  }

  const recommencer = () => {
    setReponses({})
    setReponsesOuvertes({})
    setValide(false)
    setScore(0)
  }

  const niveaux = ['facile', 'intermédiaire', 'difficile'] as const

  return (
    <div style={{ minHeight: '100vh', background: '#060d2e' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 30px rgba(99,102,241,0.4);transition:all 0.3s;border:none;cursor:pointer}
        .glow-btn:hover{box-shadow:0 0 50px rgba(99,102,241,0.7);transform:scale(1.05)}
        .option-btn{transition:all 0.2s;cursor:pointer;border:none;width:100%;text-align:left;font-family:Inter,sans-serif}
        .option-btn:hover{transform:translateX(4px)}
        textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:12px 14px;width:100%;outline:none;font-size:13px;font-family:Inter,sans-serif;resize:vertical}
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(99,102,241,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          ✏️ Exercices
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Des exercices générés par IA à partir de tes cours, adaptés à ton niveau.
        </p>

        {/* Configurateur */}
        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
            ⚙️ Configurer les exercices
          </h2>

          {/* Choix du chapitre */}
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            CHAPITRE
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {cours.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                Aucun cours importé — va d'abord importer un cours.
              </p>
            ) : cours.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); setExercices([]); setValide(false); setReponses({}) }}
                style={{
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  transition: 'all 0.2s',
                  background: selected?.id === c.id ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.04)',
                  color: selected?.id === c.id ? 'white' : 'rgba(255,255,255,0.6)',
                  outline: selected?.id === c.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {selected?.id === c.id ? '▸ ' : ''}{c.chapitre}
              </button>
            ))}
          </div>

          {/* Niveau */}
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            NIVEAU DE DIFFICULTÉ
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {niveaux.map(n => (
              <button
                key={n}
                onClick={() => setNiveau(n)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                  background: niveau === n ? (
                    n === 'facile' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                    n === 'intermédiaire' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' :
                    'linear-gradient(135deg, #ef4444, #dc2626)'
                  ) : 'rgba(255,255,255,0.04)',
                  color: niveau === n ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: niveau === n ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {n === 'facile' ? '🟢 Facile' : n === 'intermédiaire' ? '🔵 Intermédiaire' : '🔴 Difficile'}
              </button>
            ))}
          </div>

          <button
            onClick={genererExercices}
            disabled={loading || !selected}
            className="glow-btn"
            style={{
              width: '100%', color: 'white', fontWeight: 700, fontSize: 15,
              padding: '14px', borderRadius: 14, fontFamily: 'Inter, sans-serif',
              opacity: loading || !selected ? 0.5 : 1
            }}
          >
            {loading ? '🤖 Génération en cours...' : '✨ Générer 5 exercices par IA'}
          </button>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.2)', borderTop: '2px solid #818cf8', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
                Claude génère des exercices adaptés à ton cours...
              </p>
            </div>
          )}
        </div>

        {/* Exercices générés */}
        {exercices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'Inter, sans-serif' }}>
                {selected.chapitre} — {niveau}
              </h2>
              {valide && (
                <button onClick={recommencer} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                  🔄 Recommencer
                </button>
              )}
            </div>

            {exercices.map((ex, idx) => (
              <div key={ex.id} className="glass" style={{
                borderRadius: 20, padding: 24,
                animation: `fadeIn 0.4s ease ${idx * 0.1}s both`
              }}>
                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{
                    background: ex.type === 'qcm' ? 'rgba(59,130,246,0.2)' : ex.type === 'calcul' ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)',
                    border: `1px solid ${ex.type === 'qcm' ? 'rgba(59,130,246,0.4)' : ex.type === 'calcul' ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.4)'}`,
                    color: ex.type === 'qcm' ? '#60a5fa' : ex.type === 'calcul' ? '#fcd34d' : '#a78bfa',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em'
                  }}>
                    {ex.type === 'qcm' ? 'QCM' : ex.type === 'calcul' ? 'CALCUL' : 'QUESTION OUVERTE'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                    Exercice {idx + 1}/{exercices.length}
                  </span>
                </div>

                {/* Question */}
                <p style={{ color: 'white', fontWeight: 600, fontSize: 15, lineHeight: 1.6, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                  {ex.question}
                </p>

                {/* QCM */}
                {ex.type === 'qcm' && ex.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ex.options.map((opt, i) => {
                      const choisi = reponses[ex.id] === i
                      const correct = ex.reponse === i
                      let bg = 'rgba(255,255,255,0.04)'
                      let border = 'rgba(255,255,255,0.08)'
                      let color = 'rgba(255,255,255,0.7)'
                      if (!valide && choisi) { bg = 'rgba(99,102,241,0.2)'; border = 'rgba(99,102,241,0.6)'; color = 'white' }
                      if (valide && correct) { bg = 'rgba(34,197,94,0.15)'; border = 'rgba(34,197,94,0.5)'; color = '#86efac' }
                      if (valide && choisi && !correct) { bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.5)'; color = '#fca5a5' }
                      return (
                        <button
                          key={i}
                          className="option-btn"
                          onClick={() => handleQCM(ex.id, i)}
                          style={{
                            padding: '12px 16px', borderRadius: 12,
                            background: bg, border: `1px solid ${border}`,
                            color, fontSize: 14, fontWeight: choisi ? 600 : 400,
                            opacity: valide && !correct && !choisi ? 0.5 : 1
                          }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 10 }}>
                            {['A', 'B', 'C', 'D'][i]}.
                          </span>
                          {opt}
                          {valide && correct && <span style={{ marginLeft: 8 }}>✓</span>}
                          {valide && choisi && !correct && <span style={{ marginLeft: 8 }}>✗</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Question ouverte ou calcul */}
                {(ex.type === 'ouvert' || ex.type === 'calcul') && (
                  <div>
                    {!valide ? (
                      <textarea
                        rows={4}
                        placeholder={ex.type === 'calcul' ? 'Écris ta démarche et ton résultat...' : 'Écris ta réponse...'}
                        value={reponsesOuvertes[ex.id] || ''}
                        onChange={e => setReponsesOuvertes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                      />
                    ) : (
                      <div>
                        {reponsesOuvertes[ex.id] && (
                          <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>TA RÉPONSE</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{reponsesOuvertes[ex.id]}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Explication après validation */}
                {valide && (
                  <div style={{
                    marginTop: 16, padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)',
                    animation: 'fadeIn 0.4s ease'
                  }}>
                    {ex.type !== 'qcm' && ex.reponse_attendue && (
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ color: '#86efac', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>✓ RÉPONSE ATTENDUE</p>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{ex.reponse_attendue}</p>
                      </div>
                    )}
                    <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>💡 EXPLICATION</p>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{ex.explication}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Bouton valider */}
            {!valide && (
              <button
                onClick={handleValider}
                disabled={Object.keys(reponses).length < exercices.filter(e => e.type === 'qcm').length}
                className="glow-btn"
                style={{
                  width: '100%', color: 'white', fontWeight: 700, fontSize: 15,
                  padding: '16px', borderRadius: 16, fontFamily: 'Inter, sans-serif',
                  opacity: Object.keys(reponses).length < exercices.filter(e => e.type === 'qcm').length ? 0.5 : 1
                }}
              >
                Valider mes réponses →
              </button>
            )}

            {/* Score */}
            {valide && (
              <div className="glass" style={{
                borderRadius: 20, padding: 28, textAlign: 'center',
                animation: 'fadeIn 0.5s ease'
              }}>
                <p style={{ fontSize: 52, marginBottom: 8 }}>
                  {score === exercices.filter(e => e.type === 'qcm').length ? '🎉' : score >= 2 ? '💪' : '📚'}
                </p>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 36, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                  {score}/{exercices.filter(e => e.type === 'qcm').length}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 20 }}>
                  {score === exercices.filter(e => e.type === 'qcm').length
                    ? 'Parfait ! Tu maîtrises ce chapitre.'
                    : score >= 2 ? 'Bon travail ! Continue à réviser.'
                    : 'Continue à réviser ce chapitre.'}
                </p>
                <button
                  onClick={genererExercices}
                  className="glow-btn"
                  style={{ color: 'white', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 12, fontFamily: 'Inter, sans-serif' }}
                >
                  🔄 Nouveaux exercices
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
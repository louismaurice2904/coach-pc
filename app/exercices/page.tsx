'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Exercices() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [exercices, setExercices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [niveau, setNiveau] = useState<'facile' | 'intermédiaire' | 'difficile'>('intermédiaire')
  const [reponses, setReponses] = useState<Record<number, any>>({})
  const [reponsesOuvertes, setReponsesOuvertes] = useState<Record<number, string>>({})
  const [valide, setValide] = useState(false)
  const [score, setScore] = useState(0)
  const [corrections, setCorrections] = useState<Record<number, any>>({})
  const [corrigeant, setCorrigeant] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (data) setCours(data)
      const { data: profil } = await supabase.from('profils').select('premium, niveau_scolaire').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
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
    setCorrections({})

    try {
      const res = await fetch('/api/generer-exercices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapitre: selected.chapitre, contenu: selected.contenu, niveau, niveauScolaire, userId })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setExercices(data.exercices || [])
        toast('5 exercices générés ✅', 'success')
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

  const handleValider = async () => {
    let s = 0
    const { data: { user } } = await supabase.auth.getUser()

    for (const ex of exercices) {
      if (ex.type === 'qcm') {
        if (reponses[ex.id] === ex.reponse) {
          s++
        } else if (user) {
          await supabase.from('erreurs').insert({
            user_id: user.id,
            chapitre: selected.chapitre,
            question: ex.question,
            type_erreur: 'qcm',
            date_erreur: new Date().toISOString().split('T')[0],
            revisee: false
          })
        }
      }
    }

    setScore(s)
    setValide(true)
    toast(`Score QCM : ${s}/${qcmCount} ✅`, 'success')

    try {
      if (!user) return
      const scorePct = Math.round((s / Math.max(qcmCount, 1)) * 100)

      const { data: existing } = await supabase
        .from('progression_chapitres')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapitre', selected.chapitre)
        .single()

      if (existing) {
        const newMoyenne = Math.round((existing.score_moyen + scorePct) / 2)
        await supabase.from('progression_chapitres').update({
          score_moyen: newMoyenne,
          nb_sessions: existing.nb_sessions + 1
        }).eq('user_id', user.id).eq('chapitre', selected.chapitre)
      } else {
        await supabase.from('progression_chapitres').insert({
          user_id: user.id,
          chapitre: selected.chapitre,
          score_moyen: scorePct,
          nb_sessions: 1
        })
      }

      if (scorePct === 100) toast('🎉 Chapitre maîtrisé à 100% !', 'badge')
      else if (scorePct >= 80) toast('💪 Très bon score sur ce chapitre !', 'success')
    } catch (e) {
      console.error('Erreur mise à jour progression:', e)
    }
  }

  const recommencer = () => {
    setReponses({})
    setReponsesOuvertes({})
    setValide(false)
    setScore(0)
    setCorrections({})
  }

  const corrigerReponse = async (ex: any) => {
    if (!reponsesOuvertes[ex.id] || corrigeant === ex.id) return
    setCorrigeant(ex.id)
    try {
      const res = await fetch('/api/corriger-reponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: ex.question,
          reponse_eleve: reponsesOuvertes[ex.id],
          reponse_attendue: ex.reponse_attendue,
          chapitre: selected?.chapitre
        })
      })
      const data = await res.json()
      if (!data.error) {
        setCorrections(prev => ({ ...prev, [ex.id]: data }))
        toast('Correction IA reçue ✅', 'success')
      }
    } catch {
      toast('Erreur lors de la correction', 'error')
    }
    setCorrigeant(null)
  }

  const niveaux = ['facile', 'intermédiaire', 'difficile'] as const
  const qcmCount = exercices.filter(e => e.type === 'qcm').length

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:12px 14px;width:100%;outline:none;font-size:13px;font-family:Inter,sans-serif;resize:vertical}
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(56,189,248,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>✏️ Exercices</h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Des exercices générés par IA à partir de tes cours, adaptés à ton niveau.
        </p>

        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>⚙️ Configurer les exercices</h2>

          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>CHAPITRE</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {cours.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
            ) : cours.map(c => (
              <button key={c.id} onClick={() => { setSelected(c); setExercices([]); setValide(false); setReponses({}); setCorrections({}) }} style={{
                padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                background: selected?.id === c.id ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                color: selected?.id === c.id ? 'white' : 'rgba(255,255,255,0.6)',
                outline: selected?.id === c.id ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                {selected?.id === c.id ? '▸ ' : ''}{c.chapitre}
              </button>
            ))}
          </div>

          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>NIVEAU</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {niveaux.map(n => (
              <button key={n} onClick={() => setNiveau(n)} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                background: niveau === n ? 'white' : 'rgba(255,255,255,0.04)',
                color: niveau === n ? '#070b18' : 'rgba(255,255,255,0.4)',
              }}>
                {n === 'facile' ? '🟢 Facile' : n === 'intermédiaire' ? '🔵 Intermédiaire' : '🔴 Difficile'}
              </button>
            ))}
          </div>

          <button onClick={() => checkAccess(genererExercices)} disabled={loading || !selected} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 15,
            padding: '14px', borderRadius: 14, fontFamily: 'Inter, sans-serif',
            opacity: loading || !selected ? 0.5 : 1
          }}>
            {loading ? '🤖 Génération en cours...' : '✨ Générer 5 exercices par IA'}
          </button>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.2)', borderTop: '2px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
                Claude génère des exercices adaptés à ton cours...
              </p>
            </div>
          )}
        </div>

        {exercices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'Inter, sans-serif' }}>
                {selected.chapitre} — {niveau}
              </h2>
              {valide && (
                <button onClick={recommencer} style={{
                  background: 'rgba(255,255,255,0.06)', outline: '1px solid rgba(255,255,255,0.12)',
                  border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>🔄 Recommencer</button>
              )}
            </div>

            {exercices.map((ex, idx) => (
              <div key={ex.id} className="glass" style={{ borderRadius: 20, padding: 24, animation: `fadeIn 0.4s ease ${idx * 0.1}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{
                    background: ex.type === 'qcm' ? 'rgba(56,189,248,0.15)' : ex.type === 'calcul' ? 'rgba(245,158,11,0.15)' : 'rgba(167,139,250,0.15)',
                    outline: `1px solid ${ex.type === 'qcm' ? 'rgba(56,189,248,0.4)' : ex.type === 'calcul' ? 'rgba(245,158,11,0.4)' : 'rgba(167,139,250,0.4)'}`,
                    color: ex.type === 'qcm' ? '#7dd3fc' : ex.type === 'calcul' ? '#fcd34d' : '#c4b5fd',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif'
                  }}>
                    {ex.type === 'qcm' ? 'QCM' : ex.type === 'calcul' ? 'CALCUL' : 'QUESTION OUVERTE'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Exercice {idx + 1}/{exercices.length}</span>
                </div>

                <p style={{ color: 'white', fontWeight: 600, fontSize: 15, lineHeight: 1.6, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>{ex.question}</p>

                {ex.type === 'qcm' && ex.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ex.options.map((opt: string, i: number) => {
                      const choisi = reponses[ex.id] === i
                      const correct = ex.reponse === i
                      let bg = 'rgba(255,255,255,0.04)'
                      let color = 'rgba(255,255,255,0.7)'
                      let outlineColor = 'rgba(255,255,255,0.08)'
                      if (!valide && choisi) { bg = 'rgba(56,189,248,0.15)'; color = 'white'; outlineColor = 'rgba(56,189,248,0.6)' }
                      if (valide && correct) { bg = 'rgba(34,197,94,0.15)'; color = '#86efac'; outlineColor = 'rgba(34,197,94,0.5)' }
                      if (valide && choisi && !correct) { bg = 'rgba(239,68,68,0.15)'; color = '#fca5a5'; outlineColor = 'rgba(239,68,68,0.5)' }
                      return (
                        <button key={i} onClick={() => handleQCM(ex.id, i)} style={{
                          padding: '12px 16px', borderRadius: 12, border: 'none', cursor: valide ? 'default' : 'pointer',
                          textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14,
                          background: bg, color, outline: `1px solid ${outlineColor}`,
                          fontWeight: choisi ? 600 : 400, transition: 'all 0.2s',
                          opacity: valide && !correct && !choisi ? 0.5 : 1
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 10 }}>{['A', 'B', 'C', 'D'][i]}.</span>
                          {opt}
                          {valide && correct && <span style={{ marginLeft: 8 }}>✓</span>}
                          {valide && choisi && !correct && <span style={{ marginLeft: 8 }}>✗</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

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
                          <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 12, background: 'rgba(255,255,255,0.04)', outline: '1px solid rgba(255,255,255,0.08)' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>TA RÉPONSE</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{reponsesOuvertes[ex.id]}</p>
                          </div>
                        )}

                        {reponsesOuvertes[ex.id] && !corrections[ex.id] && (
                          <button onClick={() => checkAccess(() => corrigerReponse(ex))} disabled={corrigeant === ex.id} style={{
                            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'white', color: '#070b18',
                            fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                            opacity: corrigeant === ex.id ? 0.6 : 1, marginBottom: 12
                          }}>
                            {corrigeant === ex.id ? '🤖 Correction en cours...' : '🤖 Faire corriger par l\'IA'}
                          </button>
                        )}

                        {corrections[ex.id] && (
                          <div style={{
                            borderRadius: 12, padding: '16px', marginBottom: 12, animation: 'fadeIn 0.4s ease',
                            background: corrections[ex.id].note === 'correct' ? 'rgba(34,197,94,0.1)' : corrections[ex.id].note === 'partiel' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                            outline: `1px solid ${corrections[ex.id].note === 'correct' ? 'rgba(34,197,94,0.3)' : corrections[ex.id].note === 'partiel' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                          }}>
                            <p style={{
                              fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: 'Inter, sans-serif',
                              color: corrections[ex.id].note === 'correct' ? '#86efac' : corrections[ex.id].note === 'partiel' ? '#fcd34d' : '#fca5a5'
                            }}>
                              {corrections[ex.id].note === 'correct' ? '✅ Correct !' : corrections[ex.id].note === 'partiel' ? '⚡ Partiellement correct' : '❌ À revoir'}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{corrections[ex.id].commentaire}</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>💡 {corrections[ex.id].conseil}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {valide && ex.type === 'qcm' && (
                  <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(250,204,21,0.06)', outline: '1px solid rgba(250,204,21,0.2)', animation: 'fadeIn 0.4s ease' }}>
                    <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>💡 EXPLICATION</p>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{ex.explication}</p>
                  </div>
                )}
              </div>
            ))}

            {!valide && (
              <button onClick={handleValider} disabled={Object.keys(reponses).length < qcmCount} className="btn-primary" style={{
                width: '100%', fontWeight: 700, fontSize: 15,
                padding: '16px', borderRadius: 16, fontFamily: 'Inter, sans-serif',
                opacity: Object.keys(reponses).length < qcmCount ? 0.5 : 1
              }}>
                Valider mes réponses →
              </button>
            )}

            {valide && (
              <div className="glass" style={{ borderRadius: 20, padding: 28, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <p style={{ fontSize: 52, marginBottom: 8 }}>
                  {score === qcmCount ? '🎉' : score >= 2 ? '💪' : '📚'}
                </p>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 36, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                  {score}/{qcmCount}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 20 }}>
                  {score === qcmCount ? 'Parfait ! Tu maîtrises ce chapitre.' : score >= 2 ? 'Bon travail ! Continue à réviser.' : 'Continue à réviser ce chapitre.'}
                </p>
                <button onClick={() => checkAccess(genererExercices)} className="btn-primary" style={{
                  fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 12,
                  fontFamily: 'Inter, sans-serif'
                }}>
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
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Revisions() {
  const { toast } = useToast()
  const [erreurs, setErreurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [nouvelleQuestion, setNouvelleQuestion] = useState<Record<number, any>>({})
  const [reponses, setReponses] = useState<Record<number, number>>({})
  const [valides, setValides] = useState<Record<number, boolean>>({})
  const [genererLoading, setGenererLoading] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)

  const fetchErreurs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/connexion'; return }
    const { data: profil } = await supabase.from('profils').select('premium').eq('user_id', user.id).single()
    setIsPremium(profil?.premium || false)
    const { data } = await supabase
      .from('erreurs')
      .select('*')
      .eq('user_id', user.id)
      .eq('revisee', false)
      .order('date_erreur', { ascending: false })
      .limit(10)
    if (data) setErreurs(data)
    setLoading(false)
  }

  useEffect(() => { fetchErreurs() }, [])

  const genererRetry = async (erreur: any) => {
    setGenererLoading(erreur.id)
    try {
      const { data: coursData } = await supabase
        .from('cours')
        .select('*')
        .eq('chapitre', erreur.chapitre)
        .single()

      const res = await fetch('/api/generer-exercices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapitre: erreur.chapitre,
          contenu: coursData?.contenu || erreur.question,
          niveau: 'intermédiaire'
        })
      })
      const data = await res.json()
      if (data.exercices && data.exercices.length > 0) {
        setNouvelleQuestion(prev => ({ ...prev, [erreur.id]: data.exercices[0] }))
      }
    } catch {
      toast('Erreur lors de la génération', 'error')
    }
    setGenererLoading(null)
  }

  const handleReponse = (erreurId: number, index: number) => {
    if (valides[erreurId]) return
    setReponses(prev => ({ ...prev, [erreurId]: index }))
  }

  const handleValiderRetry = async (erreur: any) => {
    const question = nouvelleQuestion[erreur.id]
    const correct = reponses[erreur.id] === question.reponse
    setValides(prev => ({ ...prev, [erreur.id]: true }))

    if (correct) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('erreurs').update({ revisee: true }).eq('id', erreur.id)
      }
      toast('✅ Bien joué, cette notion est maintenant acquise !', 'success')
    } else {
      toast('Pas encore, on retente une autre fois', 'info')
    }
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
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            🧠 Mes révisions
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(167,139,250,0.15)', outline: '1px solid rgba(167,139,250,0.4)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Retravaille tes erreurs récentes pour vraiment les maîtriser.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : erreurs.length === 0 ? (
          <div className="glass" style={{ borderRadius: 24, padding: 60, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
              Aucune erreur à réviser !
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
              Continue à faire des exercices pour progresser.
            </p>
            <Link href="/exercices" className="glow-btn" style={{
              display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 14,
              padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontFamily: 'Inter, sans-serif'
            }}>
              Faire des exercices →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {erreurs.map(erreur => (
              <div key={erreur.id} className="glass" style={{ borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    background: 'rgba(239,68,68,0.15)', outline: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {erreur.chapitre}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                    {new Date(erreur.date_erreur).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                  Question ratée : <span style={{ color: 'rgba(255,255,255,0.7)' }}>{erreur.question}</span>
                </p>

                {!nouvelleQuestion[erreur.id] ? (
                  <button
                    onClick={() => checkAccess(() => genererRetry(erreur))}
                    disabled={genererLoading === erreur.id}
                    className="glow-btn"
                    style={{
                      color: 'white', fontWeight: 700, fontSize: 13, padding: '10px 20px',
                      borderRadius: 10, fontFamily: 'Inter, sans-serif',
                      opacity: genererLoading === erreur.id ? 0.6 : 1
                    }}
                  >
                    {genererLoading === erreur.id ? '🤖 Génération...' : '🔄 Retenter cette notion'}
                  </button>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                      {nouvelleQuestion[erreur.id].question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {nouvelleQuestion[erreur.id].options?.map((opt: string, i: number) => {
                        const choisi = reponses[erreur.id] === i
                        const correct = nouvelleQuestion[erreur.id].reponse === i
                        const isValide = valides[erreur.id]
                        let bg = 'rgba(255,255,255,0.04)'
                        let color = 'rgba(255,255,255,0.7)'
                        if (!isValide && choisi) { bg = 'rgba(99,102,241,0.2)'; color = 'white' }
                        if (isValide && correct) { bg = 'rgba(34,197,94,0.15)'; color = '#86efac' }
                        if (isValide && choisi && !correct) { bg = 'rgba(239,68,68,0.15)'; color = '#fca5a5' }
                        return (
                          <button
                            key={i}
                            onClick={() => handleReponse(erreur.id, i)}
                            style={{
                              padding: '10px 14px', borderRadius: 10, border: 'none',
                              cursor: isValide ? 'default' : 'pointer', textAlign: 'left',
                              fontFamily: 'Inter, sans-serif', fontSize: 13, background: bg, color
                            }}
                          >
                            {opt}
                            {isValide && correct && ' ✓'}
                          </button>
                        )
                      })}
                    </div>
                    {!valides[erreur.id] && reponses[erreur.id] !== undefined && (
                      <button
                        onClick={() => handleValiderRetry(erreur)}
                        className="glow-btn"
                        style={{
                          marginTop: 12, color: 'white', fontWeight: 700, fontSize: 13,
                          padding: '10px 20px', borderRadius: 10, fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        Valider →
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
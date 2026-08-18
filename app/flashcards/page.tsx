'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Flashcards() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState<{ sues: number; ratees: number }>({ sues: 0, ratees: 0 })
  const [terminee, setTerminee] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [userId, setUserId] = useState<string | null>(null)
  const [cardsExistantes, setCardsExistantes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('premium').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)

      const { data: existantes } = await supabase.from('flashcards').select('chapitre').eq('user_id', user.id)
      if (existantes) {
        const map: Record<string, boolean> = {}
        existantes.forEach((f: any) => { map[f.chapitre] = true })
        setCardsExistantes(map)
      }
    }
    init()
  }, [])

  const chargerCards = async (c: any) => {
    setSelected(c)
    setCurrentIndex(0)
    setFlipped(false)
    setTerminee(false)
    setSession({ sues: 0, ratees: 0 })

    const { data: existantes } = await supabase.from('flashcards').select('*').eq('user_id', userId).eq('chapitre', c.chapitre)

    if (existantes && existantes.length > 0) {
      setCards(existantes)
      return
    }

    // Générer via IA
    await genererCards(c)
  }

    const genererCards = async (c: any) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/generer-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ chapitre: c.chapitre, contenu: c.contenu })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        const nouvellesCards = data.flashcards.map((fc: any) => ({
          user_id: userId,
          chapitre: c.chapitre,
          recto: fc.recto,
          verso: fc.verso,
          niveau_maitrise: 0,
          derniere_revision: new Date().toISOString().split('T')[0]
        }))
        const { data: inserted } = await supabase.from('flashcards').insert(nouvellesCards).select()
        if (inserted) setCards(inserted)
        setCardsExistantes(prev => ({ ...prev, [c.chapitre]: true }))
        toast(`${nouvellesCards.length} flashcards générées ✅`, 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const handleFlip = () => setFlipped(!flipped)

  const handleReponse = async (sue: boolean) => {
    const card = cards[currentIndex]
    const nouveauNiveau = sue ? Math.min((card.niveau_maitrise || 0) + 1, 5) : Math.max((card.niveau_maitrise || 0) - 1, 0)

    await supabase.from('flashcards').update({
      niveau_maitrise: nouveauNiveau,
      derniere_revision: new Date().toISOString().split('T')[0]
    }).eq('id', card.id)

    setSession(prev => ({ sues: prev.sues + (sue ? 1 : 0), ratees: prev.ratees + (sue ? 0 : 1) }))

    if (currentIndex < cards.length - 1) {
      setFlipped(false)
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200)
    } else {
      setTerminee(true)
    }
  }

  const recommencer = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setTerminee(false)
    setSession({ sues: 0, ratees: 0 })
  }

  const currentCard = cards[currentIndex]
  const progressPct = cards.length > 0 ? Math.round(((currentIndex) / cards.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        .flip-card {
          perspective: 1400px;
          width: 100%;
          max-width: 480px;
          height: 300px;
          margin: 0 auto;
          cursor: pointer;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .flip-card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            🗂️ Flashcards
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Révise formules et définitions avec des cartes générées par IA à partir de tes cours.
        </p>

        {!selected && (
          <div className="glass" style={{ borderRadius: 20, padding: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>CHOISIS UN CHAPITRE</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
              ) : cours.map(c => (
                <button key={c.id} onClick={() => checkAccess(() => chargerCards(c))} style={{
                  padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  {c.chapitre}
                  {cardsExistantes[c.chapitre] && (
                    <span style={{ fontSize: 10, color: '#86efac', fontWeight: 700 }}>✓ CARTES PRÊTES</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
              Génération des flashcards...
            </p>
          </div>
        )}

        {selected && !loading && cards.length > 0 && !terminee && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button onClick={() => { setSelected(null); setCards([]) }} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                ← Changer de chapitre
              </button>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                {currentIndex + 1} / {cards.length}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 4, marginBottom: 32 }}>
              <div style={{ width: `${progressPct}%`, height: 4, borderRadius: 99, background: '#38bdf8', transition: 'width 0.4s ease' }} />
            </div>

            <div className="flip-card" onClick={handleFlip}>
              <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
                <div className="flip-card-face" style={{
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(56,189,248,0.25)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>RECTO</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 22, lineHeight: 1.5 }}>{currentCard?.recto}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 28 }}>Clique pour retourner</p>
                </div>
                <div className="flip-card-face flip-card-back" style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(34,197,94,0.25)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>VERSO</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 20, lineHeight: 1.6, fontFamily: currentCard?.verso?.match(/[=<>]/) ? 'monospace' : 'Inter, sans-serif' }}>{currentCard?.verso}</p>
                </div>
              </div>
            </div>

            {flipped && (
              <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center', animation: 'popIn 0.3s ease' }}>
                <button onClick={() => handleReponse(false)} style={{
                  padding: '14px 32px', borderRadius: 14, border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                  ✗ Pas su
                </button>
                <button onClick={() => handleReponse(true)} style={{
                  padding: '14px 32px', borderRadius: 14, border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(34,197,94,0.1)', color: '#86efac', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                  ✓ Su
                </button>
              </div>
            )}

            {!flipped && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20, fontFamily: 'Inter, sans-serif' }}>
                Retourne la carte pour voir la réponse
              </p>
            )}
          </div>
        )}

        {terminee && (
          <div className="glass" style={{ borderRadius: 24, padding: 48, textAlign: 'center', animation: 'popIn 0.4s ease' }}>
            <p style={{ fontSize: 52, marginBottom: 16 }}>
              {session.sues === cards.length ? '🎉' : session.sues > session.ratees ? '💪' : '📚'}
            </p>
            <p style={{ color: 'white', fontWeight: 900, fontSize: 32, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
              {session.sues} / {cards.length}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
              {session.sues === cards.length ? 'Toutes les cartes maîtrisées !' : `${session.ratees} carte${session.ratees > 1 ? 's' : ''} à revoir`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={recommencer} style={{
                padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                🔄 Recommencer
              </button>
              <button onClick={() => { setSelected(null); setCards([]) }} className="btn-primary" style={{
                fontWeight: 700, fontSize: 13, padding: '12px 24px', borderRadius: 12, fontFamily: 'Inter, sans-serif'
              }}>
                Changer de chapitre →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Feynman() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [notions, setNotions] = useState<string[]>([])
  const [notionActuelle, setNotionActuelle] = useState<string | null>(null)
  const [explication, setExplication] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [loadingEval, setLoadingEval] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('premium').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
    }
    init()
  }, [])

  const chargerNotions = async (c: any) => {
    setSelected(c)
    setNotionActuelle(null)
    setEvaluation(null)
    setExplication('')
    setLoading(true)
    try {
      const res = await fetch('/api/feynman-notions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapitre: c.chapitre, contenu: c.contenu, userId })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setNotions(data.notions || [])
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const evaluerExplication = async () => {
    if (!explication.trim() || explication.length < 20) {
      toast('Explique un peu plus en détail (au moins quelques phrases)', 'error')
      return
    }
    setLoadingEval(true)
    try {
      const res = await fetch('/api/feynman-evaluer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notion: notionActuelle, explication, contenu: selected?.contenu, userId })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setEvaluation(data)
        if (userId && selected) {
          await supabase.from('sessions_feynman').insert({
            user_id: userId,
            chapitre: selected.chapitre,
            notion: notionActuelle,
            explication_eleve: explication,
            score_clarte: data.score_clarte,
            date_session: new Date().toISOString().split('T')[0]
          })
        }
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoadingEval(false)
  }

  const nouvelleNotion = (notion: string) => {
    setNotionActuelle(notion)
    setExplication('')
    setEvaluation(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:14px;padding:16px;width:100%;outline:none;font-size:14px;font-family:Inter,sans-serif;resize:vertical;line-height:1.7}
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(56,189,248,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            🎓 Explique-moi ça
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Explique une notion avec tes propres mots, comme si tu l'enseignais à quelqu'un. Si tu n'arrives pas à l'expliquer simplement, c'est que tu ne la maîtrises pas encore.
        </p>

        {!selected && (
          <div className="glass" style={{ borderRadius: 20, padding: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>CHOISIS UN CHAPITRE</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
              ) : cours.map(c => (
                <button key={c.id} onClick={() => checkAccess(() => chargerNotions(c))} style={{
                  padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)'
                }}>
                  {c.chapitre}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
              Sélection des notions clés...
            </p>
          </div>
        )}

        {selected && !loading && notions.length > 0 && !notionActuelle && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <button onClick={() => { setSelected(null); setNotions([]) }} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 20
            }}>
              ← Changer de chapitre
            </button>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
              Choisis une notion à expliquer :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notions.map((n, i) => (
                <button key={i} onClick={() => nouvelleNotion(n)} className="glass" style={{
                  padding: '16px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
                  color: 'white'
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {notionActuelle && !evaluation && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <button onClick={() => setNotionActuelle(null)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 20
            }}>
              ← Choisir une autre notion
            </button>
            <div className="glass" style={{ borderRadius: 20, padding: 28 }}>
              <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>EXPLIQUE COMME À UN DÉBUTANT</p>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 20, lineHeight: 1.4 }}>{notionActuelle}</h2>
              <textarea
                rows={8}
                placeholder="Écris ton explication ici, avec tes propres mots, comme si tu parlais à quelqu'un qui ne connaît rien au sujet..."
                value={explication}
                onChange={e => setExplication(e.target.value)}
              />
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8, fontFamily: 'Inter, sans-serif' }}>{explication.length} caractères</p>
              <button onClick={evaluerExplication} disabled={loadingEval} className="btn-primary" style={{
                width: '100%', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14, marginTop: 16,
                opacity: loadingEval ? 0.6 : 1, fontFamily: 'Inter, sans-serif'
              }}>
                {loadingEval ? '🤖 Analyse en cours...' : 'Faire évaluer mon explication →'}
              </button>
            </div>
          </div>
        )}

        {evaluation && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="glass" style={{ borderRadius: 20, padding: 28, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: n <= evaluation.score_clarte ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: n <= evaluation.score_clarte ? '#070b18' : 'rgba(255,255,255,0.2)',
                      fontWeight: 800, fontSize: 13
                    }}>
                      {n}
                    </div>
                  ))}
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                  {evaluation.score_clarte}/5 clarté
                </span>
              </div>

              <div style={{ marginBottom: 18 }}>
                <p style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>✓ POINTS FORTS</p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{evaluation.points_forts}</p>
              </div>

              <div style={{ marginBottom: 18 }}>
                <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>⚡ À CLARIFIER</p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{evaluation.points_flous}</p>
              </div>

              {evaluation.erreur_factuelle && evaluation.erreur_factuelle !== 'null' && (
                <div style={{ marginBottom: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14 }}>
                  <p style={{ color: '#fca5a5', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>⚠️ ERREUR DÉTECTÉE</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{evaluation.erreur_factuelle}</p>
                </div>
              )}

              <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>💡 EXPLICATION MODÈLE</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{evaluation.reformulation_modele}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNotionActuelle(null)} style={{
                flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                Autre notion
              </button>
              <button onClick={() => { setSelected(null); setNotions([]); setNotionActuelle(null); setEvaluation(null) }} className="btn-primary" style={{
                flex: 1, fontWeight: 700, fontSize: 13, padding: '13px', borderRadius: 12, fontFamily: 'Inter, sans-serif'
              }}>
                Changer de chapitre
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
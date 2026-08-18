'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TYPE_INFO: Record<string, { icon: string; lien: string; couleur: string }> = {
  'fiche': { icon: '📋', lien: '/fiche', couleur: '#7dd3fc' },
  'exercices-facile': { icon: '🟢', lien: '/exercices', couleur: '#86efac' },
  'exercices-difficile': { icon: '🔴', lien: '/exercices', couleur: '#fca5a5' },
  'flashcards': { icon: '🗂️', lien: '/flashcards', couleur: '#c4b5fd' },
  'feynman': { icon: '🎓', lien: '/feynman', couleur: '#fcd34d' },
}

export default function Planning() {
  const { toast } = useToast()
  const [planning, setPlanning] = useState<any[]>([])
  const [noteCoach, setNoteCoach] = useState('')
  const [loading, setLoading] = useState(false)
  const [dateGeneration, setDateGeneration] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [userId, setUserId] = useState<string | null>(null)
  const [cours, setCours] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data: profil } = await supabase.from('profils').select('premium').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)

      const planningSauvegarde = localStorage.getItem('novalys_planning')
      const dateSauvegarde = localStorage.getItem('novalys_planning_date')
      if (planningSauvegarde && dateSauvegarde) {
        const joursDepuis = (Date.now() - new Date(dateSauvegarde).getTime()) / (1000 * 60 * 60 * 24)
        if (joursDepuis < 7) {
          setPlanning(JSON.parse(planningSauvegarde))
          setNoteCoach(localStorage.getItem('novalys_planning_note') || '')
          setDateGeneration(dateSauvegarde)
        }
      }
    }
    init()
  }, [])

  const genererPlanning = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/generer-planning-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setPlanning(data.planning || [])
        setNoteCoach(data.note_coach || '')
        const now = new Date().toISOString()
        setDateGeneration(now)
        localStorage.setItem('novalys_planning', JSON.stringify(data.planning))
        localStorage.setItem('novalys_planning_note', data.note_coach || '')
        localStorage.setItem('novalys_planning_date', now)
        toast('Planning généré ✅', 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const totalMinutes = planning.reduce((acc, jour) =>
    acc + jour.taches.reduce((a: number, t: any) => a + t.duree_minutes, 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; }
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        .card-hover{transition:all 0.2s ease}
        .card-hover:hover{border-color:rgba(255,255,255,0.2)!important;transform:translateX(2px)}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            📅 Ton planning de la semaine
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Généré par IA à partir de ta progression réelle et de tes contrôles à venir. Tu n'as rien à décider.
        </p>

        {cours.length === 0 && (
          <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Importe au moins un cours pour générer ton planning.
            </p>
          </div>
        )}

        {cours.length > 0 && planning.length === 0 && !loading && (
          <div className="glass" style={{ borderRadius: 20, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 16 }}>🎯</p>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Génère ton premier planning</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              L'IA analyse tes scores, tes contrôles à venir et ton temps disponible pour créer un planning réaliste et priorisé.
            </p>
            <button onClick={() => checkAccess(genererPlanning)} className="btn-primary" style={{
              fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 14, fontFamily: 'Inter, sans-serif'
            }}>
              ✨ Générer mon planning
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
              Ton coach prépare ton planning...
            </p>
          </div>
        )}

        {planning.length > 0 && !loading && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {noteCoach && (
              <div style={{ borderRadius: 16, padding: 18, marginBottom: 20, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>
                <p style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>NOTE DE TON COACH</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>{noteCoach}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                {Math.round(totalMinutes / 60 * 10) / 10}h planifiées cette semaine
              </p>
              <button onClick={() => checkAccess(genererPlanning)} style={{
                background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                🔄 Régénérer
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {planning.map((jour, i) => (
                <div key={i} className="glass" style={{ borderRadius: 16, padding: 20 }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{jour.jour}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {jour.taches.map((tache: any, j: number) => {
                      const info = TYPE_INFO[tache.type] || TYPE_INFO['fiche']
                      return (
                        <Link key={j} href={info.lien} className="card-hover" style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          textDecoration: 'none'
                        }}>
                          <span style={{ fontSize: 16 }}>{info.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>{tache.titre}</p>
                          </div>
                          <span style={{ color: info.couleur, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{tache.duree_minutes} min</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
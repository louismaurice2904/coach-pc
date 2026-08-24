'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useToast } from '../components/Toast'
import { Confetti } from '../components/Confetti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const ADMIN_EMAIL = 'louismaurice2904@gmail.com'
const BADGE_LIST = [
  { id: 'premier_cours', icon: '💥', label: 'Big Bang' },
  { id: 'streak_3', icon: '⚛️', label: 'Réaction en chaîne' },
  { id: 'streak_7', icon: '🧪', label: 'Catalyseur' },
  { id: 'mi_programme', icon: '🔬', label: 'Masse critique' },
  { id: 'programme_complet', icon: '🏆', label: 'Équilibre thermodynamique' },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function Dashboard() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [profil, setProfil] = useState<any>(null)
  const [cours, setCours] = useState<any[]>([])
  const [joursRestants, setJoursRestants] = useState<number | null>(null)
  const [conseil, setConseil] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakMax, setStreakMax] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [confetti, setConfetti] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [joursInactivite, setJoursInactivite] = useState(0)
  const [showAlerteInactivite, setShowAlerteInactivite] = useState(false)
  const [debrief, setDebrief] = useState<string | null>(null)
  const [loadingDebrief, setLoadingDebrief] = useState(false)
  const [progressions, setProgressions] = useState<any[]>([])
  const [essaiInfo, setEssaiInfo] = useState<{ joursRestants: number; abonnementPaye: boolean } | null>(null)

  const updateStreak = useCallback(async (userId: string, coursCount: number) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const { data: s } = await supabase.from('streaks').select('*').eq('user_id', userId).single()

    if (s?.derniere_activite) {
      const derniereDate = new Date(s.derniere_activite)
      const diffJours = Math.floor((Date.now() - derniereDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffJours >= 3) {
        setJoursInactivite(diffJours)
        setShowAlerteInactivite(true)
      }
    }

    let newStreak = 1
    let newMax = 1
    let currentBadges: string[] = []

    if (!s) {
      await supabase.from('streaks').insert({
        user_id: userId, derniere_activite: today,
        streak_actuel: 1, streak_max: 1, badges: '[]'
      })
    } else {
      currentBadges = JSON.parse(s.badges || '[]')
      if (s.derniere_activite === today) {
        newStreak = s.streak_actuel
        newMax = s.streak_max
      } else {
        newStreak = s.derniere_activite === yesterday ? s.streak_actuel + 1 : 1
        newMax = Math.max(newStreak, s.streak_max || 0)
        await supabase.from('streaks').update({
          derniere_activite: today,
          streak_actuel: newStreak,
          streak_max: newMax
        }).eq('user_id', userId)
      }
    }

    setStreak(newStreak)
    setStreakMax(newMax)

    const newBadges = [...currentBadges]
    const toUnlock: string[] = []
    if (coursCount >= 1 && !newBadges.includes('premier_cours')) { newBadges.push('premier_cours'); toUnlock.push('premier_cours') }
    if (newStreak >= 3 && !newBadges.includes('streak_3')) { newBadges.push('streak_3'); toUnlock.push('streak_3') }
    if (newStreak >= 7 && !newBadges.includes('streak_7')) { newBadges.push('streak_7'); toUnlock.push('streak_7') }
    if (coursCount >= 6 && !newBadges.includes('mi_programme')) { newBadges.push('mi_programme'); toUnlock.push('mi_programme') }
    if (coursCount >= 12 && !newBadges.includes('programme_complet')) { newBadges.push('programme_complet'); toUnlock.push('programme_complet') }

    if (toUnlock.length > 0) {
      await supabase.from('streaks').update({ badges: JSON.stringify(newBadges) }).eq('user_id', userId)
      const badge = BADGE_LIST.find(b => b.id === toUnlock[0])
      if (badge) {
        toast(`${badge.icon} Badge débloqué : ${badge.label} !`, 'badge')
        setConfetti(true)
      }
    }

    setBadges(newBadges)
  }, [toast])

  useEffect(() => {
    const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }

      if (user.email === ADMIN_EMAIL) {
        window.location.href = '/admin'
        return
      }

             const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()

      if (!p || !p.prenom || !p.classe) {
        window.location.href = '/bienvenue'
        return
      }


      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (p?.essai_premium_fin && !p?.abonnement_paye) {
        const finEssai = new Date(p.essai_premium_fin)
        const joursRestants = Math.ceil((finEssai.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setEssaiInfo({ joursRestants: Math.max(joursRestants, 0), abonnementPaye: false })
      }
      if (p) {
        setProfil(p)
        if (p.date_bac) {
          const diff = Math.ceil((new Date(p.date_bac).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          setJoursRestants(diff)
        }
      }
      if (c) setCours(c)

      const { data: prog } = await supabase.from('progression_chapitres').select('*').eq('user_id', user.id)
      if (prog) setProgressions(prog)

      const { data: conseilsData } = await supabase.from('conseils').select('*').eq('actif', true)
      if (conseilsData && conseilsData.length > 0) {
        const random = conseilsData[Math.floor(Math.random() * conseilsData.length)]
        setConseil(random.texte)
      }

      await updateStreak(user.id, c?.length || 0)

      const onboarded = localStorage.getItem('coachpc_onboarded')
      if (!onboarded) setShowOnboarding(true)

      const dateDebutSemaine = new Date()
      dateDebutSemaine.setDate(dateDebutSemaine.getDate() - dateDebutSemaine.getDay())
      const dateStr = dateDebutSemaine.toISOString().split('T')[0]

      const { data: debriefExistant } = await supabase
        .from('debriefs_hebdo')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_debut_semaine', dateStr)
        .single()

      if (debriefExistant) {
        setDebrief(debriefExistant.contenu)
      } else {
        setLoadingDebrief(true)
                try {
          const { data: { session } } = await supabase.auth.getSession()
          const res = await fetch('/api/generer-debrief', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ prenom: p?.prenom })
          })
            
          const data = await res.json()
          if (data.message) setDebrief(data.message)
        } catch (e) {
          console.error('Erreur génération debrief:', e)
        }
        setLoadingDebrief(false)
      }
    }
    init()
  }, [updateStreak])

  const progressionGlobale = cours.length > 0 ? Math.min(Math.round((cours.length / 12) * 100), 100) : 0
  const scoreMoyen = progressions.length > 0
    ? Math.round(progressions.reduce((acc, p) => acc + p.score_moyen, 0) / progressions.length)
    : 0

  const dernierCours = cours.length > 0 ? cours[cours.length - 1] : null

  const onboardingSteps = [
    { label: 'Complète ton profil', done: !!profil?.prenom, href: '/profil' },
    { label: 'Importe ton premier cours', done: cours.length > 0, href: '/cours' },
    { label: 'Consulte ton planning', done: false, href: '/planning' },
  ]

  const joursActivite = Array.from({ length: 7 }, (_, i) => {
    const position = 6 - i
    return position < streak
  })
  const nomsJours = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; }
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.25s ease}
        .card-hover:hover{border-color:rgba(255,255,255,0.18)!important;transform:translateY(-2px)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .badge-locked{opacity:0.3;filter:grayscale(1)}
        .badge-unlocked{transition:transform 0.2s}
        .badge-unlocked:hover{transform:scale(1.06)}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px', position: 'relative', zIndex: 1 }}>

        {showAlerteInactivite && (
          <div style={{
            borderRadius: 16, padding: isMobile ? 14 : 18, marginBottom: 18,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            animation: 'slideDown 0.4s ease', display: 'flex', alignItems: 'center', gap: 14
          }}>
            <span style={{ fontSize: 20 }}>😴</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13, marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
                Ça fait {joursInactivite} jours qu'on ne t'a pas vu.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                Reprends une petite session aujourd'hui pour ne pas perdre le rythme.
              </p>
            </div>
            <button onClick={() => setShowAlerteInactivite(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
          </div>
        )}

        {showOnboarding && (
          <div style={{ borderRadius: 16, padding: isMobile ? 16 : 22, marginBottom: 18, border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>POUR COMMENCER</p>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>3 étapes pour débloquer Novalys</h2>
              </div>
              <button onClick={() => { setShowOnboarding(false); localStorage.setItem('coachpc_onboarded', '1') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
              {onboardingSteps.map((step, i) => (
                <Link key={i} href={step.href} style={{
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: step.done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${step.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    color: step.done ? '#86efac' : 'rgba(255,255,255,0.4)'
                  }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span style={{ color: step.done ? '#86efac' : 'rgba(255,255,255,0.65)', fontSize: 12, textDecoration: step.done ? 'line-through' : 'none' }}>
                    {step.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Zone héros */}
        <div className="glass" style={{ borderRadius: 20, padding: isMobile ? 20 : 30, marginBottom: 18 }}>
                    {essaiInfo && essaiInfo.joursRestants > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap'
            }}>
              <p style={{ color: '#7dd3fc', fontSize: 13, fontWeight: 600 }}>
                👑 Essai Premium — {essaiInfo.joursRestants} jour{essaiInfo.joursRestants > 1 ? 's' : ''} restant{essaiInfo.joursRestants > 1 ? 's' : ''}
              </p>
              <Link href="/profil" style={{
                color: '#070b18', background: 'white', fontWeight: 700, fontSize: 12,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none'
              }}>
                Passer Premium →
              </Link>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 4 }}>
                Bonjour {profil?.prenom || ''}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {profil ? `${profil.classe} · Objectif ${profil.objectif_note}/20` : ''}
              </p>
            </div>
                       {joursRestants !== null && profil?.classe === 'Terminale' && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: joursRestants < 30 ? '#fca5a5' : 'white', lineHeight: 1 }}>{joursRestants}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>jours avant le bac</p>
              </div>
            )}
          </div>

          {(debrief || loadingDebrief) && (
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>TON DEBRIEF DE LA SEMAINE</p>
              {loadingDebrief ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontStyle: 'italic' }}>Ton coach prépare ton debrief...</p>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7, maxWidth: 700 }}>{debrief}</p>
              )}
            </div>
          )}

          {dernierCours ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>REPRENDRE</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{dernierCours.chapitre}</p>
              </div>
              <Link href="/exercices" className="btn-primary" style={{
                fontWeight: 700, fontSize: 13, padding: '12px 20px', borderRadius: 12, textDecoration: 'none'
              }}>
                Reprendre →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Commence par importer ton premier cours.</p>
              <Link href="/cours" className="btn-primary" style={{
                fontWeight: 700, fontSize: 13, padding: '12px 20px', borderRadius: 12, textDecoration: 'none'
              }}>
                Importer →
              </Link>
            </div>
          )}
        </div>

        {/* Mise en page : colonnes sur desktop, empilé sur mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 18, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Cours', value: cours.length },
                { label: 'Streak max', value: streakMax },
                { label: 'Score moyen', value: `${scoreMoyen}%` },
                { label: 'Badges', value: badges.length },
              ].map(s => (
                <div key={s.label} className="glass card-hover" style={{ borderRadius: 16, padding: '16px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 6 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="glass" style={{ borderRadius: 20, padding: isMobile ? 16 : '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>Régularité</p>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{streak} j.</span>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {joursActivite.map((actif, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: 6, marginBottom: 4,
                      background: actif ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.04)',
                      border: actif ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(255,255,255,0.06)'
                    }} />
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{nomsJours[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 20, padding: isMobile ? 16 : '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Progression du programme</h2>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 15 }}>{progressionGlobale}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6 }}>
                <div style={{ width: `${progressionGlobale}%`, height: 6, borderRadius: 99, background: '#38bdf8', transition: 'width 1s ease' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
                {cours.length} chapitre{cours.length > 1 ? 's' : ''} importé{cours.length > 1 ? 's' : ''} sur 12
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div className="glass" style={{ borderRadius: 20, padding: isMobile ? 16 : 22 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Badges</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                {BADGE_LIST.map(badge => {
                  const unlocked = badges.includes(badge.id)
                  return (
                    <div key={badge.id} className={unlocked ? 'badge-unlocked' : 'badge-locked'} style={{
                      textAlign: 'center', padding: isMobile ? '8px 4px' : '12px 6px', borderRadius: 12,
                      background: unlocked ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${unlocked ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}`
                    }}>
                      <div style={{ fontSize: isMobile ? 16 : 20, marginBottom: 4 }}>{badge.icon}</div>
                      {!isMobile && (
                        <p style={{ color: unlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 600, lineHeight: 1.3 }}>{badge.label}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {conseil && (
              <div style={{ borderRadius: 20, padding: isMobile ? 16 : 20, background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)' }}>
                <p style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>💡 CONSEIL DU JOUR</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>{conseil}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
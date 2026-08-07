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

const BADGE_LIST = [
  { id: 'premier_cours', icon: '💥', label: 'Big Bang' },
  { id: 'streak_3', icon: '⚛️', label: 'Réaction en chaîne' },
  { id: 'streak_7', icon: '🧪', label: 'Catalyseur' },
  { id: 'mi_programme', icon: '🔬', label: 'Masse critique' },
  { id: 'programme_complet', icon: '🏆', label: 'Équilibre thermodynamique' },
]

export default function Dashboard() {
  const { toast } = useToast()
  const [profil, setProfil] = useState<any>(null)
  const [cours, setCours] = useState<any[]>([])
  const [joursRestants, setJoursRestants] = useState<number | null>(null)
  const [conseil, setConseil] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakMax, setStreakMax] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [confetti, setConfetti] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [joursInactivite, setJoursInactivite] = useState(0)
  const [showAlerteInactivite, setShowAlerteInactivite] = useState(false)

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

      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)

      if (p) {
        setProfil(p)
        if (p.date_bac) {
          const diff = Math.ceil((new Date(p.date_bac).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          setJoursRestants(diff)
        }
      }
      if (c) setCours(c)

      const { data: conseilsData } = await supabase.from('conseils').select('*').eq('actif', true)
      if (conseilsData && conseilsData.length > 0) {
        const random = conseilsData[Math.floor(Math.random() * conseilsData.length)]
        setConseil(random.texte)
      }

      await updateStreak(user.id, c?.length || 0)

      const onboarded = localStorage.getItem('coachpc_onboarded')
      if (!onboarded) setShowOnboarding(true)
    }
    init()
  }, [updateStreak])

  const progression = cours.length > 0 ? Math.min(Math.round((cours.length / 12) * 100), 100) : 0

  const onboardingSteps = [
    { label: 'Complète ton profil', done: !!profil?.prenom, href: '/profil' },
    { label: 'Importe ton premier cours', done: cours.length > 0, href: '/cours' },
    { label: 'Consulte ton planning', done: false, href: '/planning' },
  ]

  const faqs = [
    { q: "Comment fonctionne la génération de fiches ?", r: "Tu importes ton cours, l'IA génère automatiquement une fiche structurée. Disponible en Premium." },
    { q: "Les exercices sont-ils adaptés au bac ?", r: "Oui — au format officiel du bac de physique-chimie." },
    { q: "Puis-je importer des cours par photo ?", r: "Disponible en version Premium." },
    { q: "Comment fonctionne le planning ?", r: "Généré selon ton temps disponible et tes chapitres importés." },
    { q: "Mes données sont-elles sécurisées ?", r: "Oui, stockées sur Supabase (infrastructure chiffrée). Seul toi y as accès." },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .shimmer{background:linear-gradient(90deg,#fff 0%,#60a5fa 40%,#7dd3fc 60%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.3s ease}
        .card-hover:hover{transform:translateY(-4px);background:rgba(255,255,255,0.07)!important;border-color:rgba(99,102,241,0.4)!important}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 30px rgba(99,102,241,0.4);transition:all 0.3s;border:none;cursor:pointer}
        .glow-btn:hover{box-shadow:0 0 50px rgba(99,102,241,0.7);transform:scale(1.05)}
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .badge-locked{opacity:0.3;filter:grayscale(1)}
        .badge-unlocked{transition:transform 0.2s}
        .badge-unlocked:hover{transform:scale(1.08)}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* Alerte inactivité */}
        {showAlerteInactivite && (
          <div style={{
            borderRadius: 18, padding: 20, marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(217,119,6,0.1))',
            border: '1px solid rgba(239,68,68,0.35)', animation: 'slideDown 0.4s ease',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <span style={{ fontSize: 28 }}>😴</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: 14, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                Ça fait {joursInactivite} jours qu'on ne t'a pas vu !
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                Ton bac n'attend pas — reprends une petite session aujourd'hui pour ne pas perdre le rythme.
              </p>
            </div>
            <button onClick={() => setShowAlerteInactivite(false)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20, flexShrink: 0
            }}>×</button>
          </div>
        )}

        {/* Onboarding */}
        {showOnboarding && (
          <div style={{
            borderRadius: 20, padding: 24, marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>🚀 POUR COMMENCER</p>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>3 étapes pour débloquer Novalys</h2>
              </div>
              <button onClick={() => { setShowOnboarding(false); localStorage.setItem('coachpc_onboarded', '1') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {onboardingSteps.map((step, i) => (
                <Link key={i} href={step.href} style={{
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 12,
                  background: step.done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${step.done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700,
                    background: step.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${step.done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: step.done ? '#86efac' : 'rgba(255,255,255,0.5)'
                  }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    color: step.done ? '#86efac' : 'rgba(255,255,255,0.7)', fontSize: 14,
                    fontWeight: step.done ? 600 : 400,
                    textDecoration: step.done ? 'line-through' : 'none'
                  }}>
                    {step.label}
                  </span>
                  {!step.done && <span style={{ marginLeft: 'auto', color: '#38bdf8', fontSize: 13 }}>→</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: 6 }}>
              Bonjour {profil?.prenom || ''} 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
              {profil ? `${profil.classe} · Objectif ${profil.objectif_note}/20 · ${profil.temps_semaine}h/semaine` : 'Chargement...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              textAlign: 'center', borderRadius: 16, padding: '12px 18px',
              background: streak >= 3 ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${streak >= 3 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
              animation: streak >= 3 ? 'float 3s ease-in-out infinite' : 'none'
            }}>
              <p style={{ fontSize: 22, lineHeight: 1 }}>{streak >= 3 ? '🔥' : '💤'}</p>
              <p style={{ color: streak >= 3 ? '#fcd34d' : 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: 22, lineHeight: 1, marginTop: 4 }}>{streak}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>jours</p>
            </div>
            {joursRestants !== null && (
              <div style={{
                textAlign: 'center', borderRadius: 16, padding: '12px 20px',
                background: joursRestants < 30 ? 'linear-gradient(135deg, #7f1d1d, #dc2626)' : 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 30px rgba(99,102,241,0.3)'
              }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1 }}>{joursRestants}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>jours avant le bac</p>
              </div>
            )}
          </div>
        </div>

        {/* Progression */}
        <div className="glass card-hover" style={{ borderRadius: 20, padding: 24, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>📈 Progression globale</h2>
            <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: 22 }}>{progression}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 10 }}>
            <div style={{
              width: `${progression}%`, height: 10, borderRadius: 99,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 0 12px rgba(99,102,241,0.6)',
              transition: 'width 1s ease'
            }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>
            {cours.length} chapitre{cours.length > 1 ? 's' : ''} importé{cours.length > 1 ? 's' : ''} sur 12
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          {[
            { label: 'Cours importés', value: cours.length, icon: '📚', color: '#3b82f6' },
            { label: 'Streak max', value: streakMax, icon: '🏅', color: '#f59e0b' },
            { label: 'Badges', value: badges.length, icon: '🎖️', color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="glass card-hover" style={{ borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
              <p style={{ fontSize: 38, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 18 }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏆 Mes badges</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {BADGE_LIST.map(badge => {
              const unlocked = badges.includes(badge.id)
              return (
                <div key={badge.id} className={unlocked ? 'badge-unlocked' : 'badge-locked'} style={{
                  textAlign: 'center', padding: '16px 8px', borderRadius: 14, position: 'relative', overflow: 'hidden',
                  background: unlocked ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${unlocked ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: unlocked ? '0 0 20px rgba(99,102,241,0.2)' : 'none'
                }}>
                  {unlocked && (
                    <div style={{
                      position: 'absolute', top: -20, right: -20, width: 60, height: 60,
                      borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
                    }} />
                  )}
                  <div style={{ fontSize: 30, marginBottom: 8, position: 'relative', zIndex: 1, filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.5 }}>
                    {badge.icon}
                  </div>
                  <p style={{ color: unlocked ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, lineHeight: 1.3, position: 'relative', zIndex: 1 }}>{badge.label}</p>
                  {unlocked && (
                    <div style={{ marginTop: 6, fontSize: 9, color: '#7dd3fc', fontWeight: 600, position: 'relative', zIndex: 1 }}>DÉBLOQUÉ</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Conseil */}
        {conseil && (
          <div style={{ borderRadius: 20, padding: 20, marginBottom: 18, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 26, animation: 'float 3s ease-in-out infinite' }}>💡</span>
              <div>
                <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>CONSEIL DU JOUR</p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7 }}>{conseil}</p>
              </div>
            </div>
          </div>
        )}

        {/* Derniers cours + Prochaine étape */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="glass card-hover" style={{ borderRadius: 20, padding: 24 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📚 Derniers cours</h2>
            {cours.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucun cours importé.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cours.slice(-3).reverse().map(c => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#38bdf8' }}>→</span> {c.chapitre}
                  </div>
                ))}
              </div>
            )}
            <Link href="/cours" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              + Importer un cours
            </Link>
          </div>

          <div style={{
            borderRadius: 20, padding: 24,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.3)'
          }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎯 Prochaine étape</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              {cours.length === 0 ? "Commence par importer ton premier cours." : "Consulte tes fiches pour renforcer tes connaissances."}
            </p>
            <Link href={cours.length === 0 ? '/cours' : '/fiche'} className="glow-btn" style={{
              display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 13,
              padding: '12px 20px', borderRadius: 12, textDecoration: 'none'
            }}>
              {cours.length === 0 ? "Importer un cours →" : "Voir mes fiches →"}
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="glass" style={{ borderRadius: 20, padding: 28 }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>❓ Questions fréquentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', cursor: 'pointer'
              }} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{faq.q}</span>
                  <span style={{
                    color: '#38bdf8', fontSize: 20, marginLeft: 12, flexShrink: 0,
                    transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.3s'
                  }}>+</span>
                </div>
                {faqOpen === i && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8, paddingTop: 14 }}>{faq.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
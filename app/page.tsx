'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
    }}>
      {children}
    </div>
  )
}

function CountUp({ end, suffix = '', duration = 1500 }: { end: number, suffix?: string, duration?: number }) {
  const { ref, inView } = useInView(0.5)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView])
  return <span ref={ref}>{count}{suffix}</span>
}

function MagneticLink({ href, children, className, style, strength = 8 }: { href: string, children: React.ReactNode, className?: string, style?: React.CSSProperties, strength?: number }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left - rect.width / 2) / rect.width) * strength
    const y = ((e.clientY - rect.top - rect.height / 2) / rect.height) * strength
    setOffset({ x, y })
  }
  return (
    <Link
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={className}
      style={{ ...style, transform: `translate(${offset.x}px, ${offset.y}px)`, transition: 'transform 0.15s ease-out', display: 'inline-block' }}
    >
      {children}
    </Link>
  )
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const [rot, setRot] = useState({ x: 0, y: 0 })
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setRot({ x: (py - 0.5) * -8, y: (px - 0.5) * 8 })
  }
  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      style={{ transform: `perspective(1200px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transition: 'transform 0.2s ease-out' }}
    >
      {children}
    </div>
  )
}

function useMousePos() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 })
  useEffect(() => {
    const handle = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])
  return pos
}

function CursorGlow() {
  const pos = useMousePos()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: 220, height: 220, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(56,189,248,0.06), transparent 70%)',
      transform: `translate(${pos.x - 110}px, ${pos.y - 110}px)`,
      pointerEvents: 'none', zIndex: 1, transition: 'transform 0.15s ease-out', filter: 'blur(14px)'
    }} />
  )
}

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const handle = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ height: '100%', width: `${progress}%`, background: '#38bdf8', transition: 'width 0.1s linear' }} />
    </div>
  )
}

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

const chapitresTicker = [
  { niveau: 'Seconde', nom: 'Constitution de la matière' },
  { niveau: 'Seconde', nom: 'Mouvement et vitesse' },
  { niveau: 'Seconde', nom: 'Énergie et ses transferts' },
  { niveau: 'Première', nom: 'Ondes et signaux' },
  { niveau: 'Première', nom: 'Transformations chimiques' },
  { niveau: 'Première', nom: 'Mouvement et interactions' },
  { niveau: 'Terminale', nom: 'Cinétique chimique' },
  { niveau: 'Terminale', nom: 'Équilibres acido-basiques' },
  { niveau: 'Terminale', nom: 'Électrochimie' },
  { niveau: 'Terminale', nom: 'Ondes et particules' },
  { niveau: 'Terminale', nom: 'Champs et forces' },
  { niveau: 'Terminale', nom: 'Chimie organique' },
]

const programmeComplet = {
  'Seconde': [
    'Constitution et transformations de la matière',
    'Mouvement et interactions',
    'Ondes et signaux',
    'Énergie, conversions et transferts',
    'Description de la matière à l\'échelle macroscopique',
    'Évolution temporelle d\'un système',
    'Description d\'un fluide au repos',
    'Sécurité et prévention des risques chimiques',
  ],
  'Première': [
    'Ondes et signaux',
    'Transformations chimiques',
    'Mouvement et interactions mécaniques',
    'Énergie : conversion et stockage',
    'Suivi de l\'évolution d\'un système chimique',
    'Quantité de matière et concentration',
    'Structures et propriétés des entités organiques',
    'Mouvement dans un champ',
    'Réactions acido-basiques',
    'Structure microscopique et propriétés macroscopiques',
  ],
  'Terminale': [
    'Cinétique chimique',
    'Équilibres acido-basiques',
    'Électrochimie',
    'Ondes et particules',
    'Champs et forces',
    'Chimie organique',
    'Avancement et modélisation d\'un système',
    'Titrages et dosages',
    'Mouvement dans un champ uniforme',
    'Temps, mouvement et évolution',
    'Structure et transformation de la matière',
    'Conversion et transfert d\'énergie',
  ],
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [dashStep, setDashStep] = useState(0)
  const [niveauActif, setNiveauActif] = useState<'Seconde' | 'Première' | 'Terminale'>('Terminale')
  const [activeTab, setActiveTab] = useState<'fiche' | 'exercice' | 'planning' | 'controle'>('fiche')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setDashStep(p => (p + 1) % 4), 4500)
    return () => clearInterval(t)
  }, [])

  const tabs = [
    { id: 'fiche', label: 'Fiche', url: 'fiche' },
    { id: 'exercice', label: 'Exercices', url: 'exercices' },
    { id: 'planning', label: 'Planning', url: 'planning' },
    { id: 'controle', label: 'Contrôle', url: 'bac-blanc' },
  ] as const

  return (
    <div style={{ background: '#070b18', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100%; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gridDrift { from{background-position:0 0, 0 0} to{background-position:60px 60px, 60px 60px} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes bounceArrow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes tabFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .shimmer {
          background: linear-gradient(90deg, #fff 0%, #38bdf8 45%, #fff 100%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        .btn-primary { background: #fff; color: #070b18; transition: opacity 0.2s ease; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.16); color: rgba(255,255,255,0.85); transition: all 0.2s ease; }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.03); }
        .card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); }
        .card-hover { transition: border-color 0.25s ease, transform 0.25s ease; }
        .card-hover:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .grid-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.4;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse 55% 45% at 50% 25%, black 20%, transparent 70%);
          mask-image: radial-gradient(ellipse 55% 45% at 50% 25%, black 20%, transparent 70%);
          animation: gridDrift 8s linear infinite;
        }
        .step-line { position: relative; }
        .step-line::before {
          content: ''; position: absolute; left: 23px; top: 52px; bottom: -36px; width: 1px;
          background: rgba(255,255,255,0.12);
        }
        .step-line:last-child::before { display: none; }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 auto; max-width: 640px; }
        .tab-btn { transition: all 0.2s ease; }
        .marquee-track { display: flex; gap: 12px; width: max-content; animation: marquee 42s linear infinite; }
        .marquee-wrap:hover .marquee-track { animation-play-state: paused; }
        .scroll-hint { animation: bounceArrow 2s ease-in-out infinite; }
        .eyebrow { color: #38bdf8; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; }
      `}</style>

      <div className="grid-bg" />
      {!isMobile && <CursorGlow />}
      <ScrollProgressBar />
      <div style={{ position: 'fixed', top: -240, right: -200, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0, transform: `translateY(${scrollY * 0.15}px)` }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? '0 16px' : '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
        background: scrollY > 50 || menuOuvert ? 'rgba(7,11,24,0.96)' : 'transparent',
        backdropFilter: scrollY > 50 || menuOuvert ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 50 || menuOuvert ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
        <img src="/logo.svg" alt="Novalys" style={{ height: 26 }} />

        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Fonctionnalités', 'Démo', 'Programme', 'Tarifs', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
              >{item}</a>
            ))}
          </div>
        )}

        {!isMobile ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link href="/parents" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>Vous êtes parent ?</Link>
            <Link href="/connexion" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textDecoration: 'none' }}>Se connecter</Link>
            <MagneticLink href="/inscription" className="btn-primary" style={{ fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none' }}>
              Essai gratuit
            </MagneticLink>
          </div>
        ) : (
          <button onClick={() => setMenuOuvert(!menuOuvert)} style={{
            background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer', padding: 4
          }}>
            {menuOuvert ? '×' : '☰'}
          </button>
        )}
      </nav>

      {isMobile && menuOuvert && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99,
          background: 'rgba(7,11,24,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          {['Fonctionnalités', 'Démo', 'Programme', 'Tarifs', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOuvert(false)} style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 15, textDecoration: 'none', padding: '10px 4px'
            }}>{item}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/connexion" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textDecoration: 'none' }}>Se connecter</Link>
            <Link href="/inscription" className="btn-primary" style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, padding: '12px 20px', borderRadius: 10, textDecoration: 'none' }}>
              Essai gratuit
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 2, minHeight: isMobile ? 'auto' : '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '90px 20px 40px' : '110px 40px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr', gap: isMobile ? 40 : 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 20 : 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
              <span className="eyebrow" style={{ fontSize: isMobile ? 10 : 12 }}>PHYSIQUE-CHIMIE · SECONDE À TERMINALE</span>
            </div>
            <h1 style={{ fontSize: isMobile ? 36 : 60, fontWeight: 900, lineHeight: 1.1, marginBottom: isMobile ? 18 : 26, letterSpacing: '-1.5px' }}>
              <span style={{ color: 'white' }}>Arrête de te demander</span><br />
              <span className="shimmer">quoi réviser.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 15 : 18, lineHeight: 1.7, marginBottom: isMobile ? 28 : 40, maxWidth: 480 }}>
              Novalys importe ton cours, génère ta fiche, tes exercices et ton suivi — puis te dit, chaque jour, exactement quoi faire.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MagneticLink href="/inscription" className="btn-primary" style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, padding: isMobile ? '14px 26px' : '15px 30px', borderRadius: 12, textDecoration: 'none' }}>
                Commencer gratuitement
              </MagneticLink>
              <MagneticLink href="/connexion" className="btn-secondary" style={{ fontWeight: 600, fontSize: isMobile ? 15 : 16, padding: isMobile ? '14px 26px' : '15px 30px', borderRadius: 12, textDecoration: 'none' }}>
                J'ai déjà un compte
              </MagneticLink>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? 24 : 40, marginTop: isMobile ? 36 : 52, flexWrap: 'wrap' }}>
              {[
                { value: 3, suffix: '', label: 'niveaux couverts' },
                { value: 30, suffix: '', label: 'chapitres au programme' },
                { value: 0, suffix: '€', label: 'pour démarrer' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'white', marginBottom: 2 }}><CountUp end={s.value} suffix={s.suffix} /></p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock-up */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'float 4.5s ease-in-out infinite' }}>
            <TiltCard>
              <div style={{ width: isMobile ? '100%' : 350, maxWidth: 350, borderRadius: 16, overflow: 'hidden', background: '#0c1120', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
                <div style={{ background: '#10182c', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Nova<span style={{ color: '#38bdf8' }}>lys</span></span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#5f5f66' }} />)}
                  </div>
                </div>
                <div style={{ padding: 20, minHeight: 300 }}>
                  {dashStep === 0 && (
                    <div style={{ animation: 'float 0.5s ease' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4, letterSpacing: '0.06em' }}>TABLEAU DE BORD</p>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Bonjour Emma</p>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Jours avant le bac</p>
                          <p style={{ color: 'white', fontWeight: 800, fontSize: 24 }}>47</p>
                        </div>
                        <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>J-47</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>Progression</span>
                          <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>67%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 4 }}>
                          <div style={{ background: '#38bdf8', borderRadius: 99, height: 4, width: '67%' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {dashStep === 1 && (
                    <div style={{ animation: 'float 0.5s ease' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4, letterSpacing: '0.06em' }}>FICHE · GÉNÉRÉE PAR IA</p>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Cinétique chimique</p>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <p style={{ color: '#38bdf8', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>POINTS CLÉS</p>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.6 }}>La vitesse de réaction dépend de la concentration, température et catalyseur.</p>
                      </div>
                    </div>
                  )}
                  {dashStep === 2 && (
                    <div style={{ animation: 'float 0.5s ease' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4, letterSpacing: '0.06em' }}>EXERCICE</p>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>Quel facteur n'influence pas la vitesse de réaction ?</p>
                      {['La température', 'La couleur du récipient', 'La concentration'].map((opt, i) => (
                        <div key={opt} style={{
                          padding: '9px 12px', borderRadius: 8, marginBottom: 7, fontSize: 11,
                          background: i === 1 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                          border: i === 1 ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.06)',
                          color: i === 1 ? '#7dd3fc' : 'rgba(255,255,255,0.5)'
                        }}>
                          {opt} {i === 1 && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  {dashStep === 3 && (
                    <div style={{ animation: 'float 0.5s ease' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4, letterSpacing: '0.06em' }}>CORRECTION IA</p>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 13, marginBottom: 10 }}>
                        <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Correct</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}>Ta démarche est juste, tu as bien identifié la relation entre concentration et vitesse.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: '0 20px 16px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ width: dashStep === i ? 16 : 5, height: 5, borderRadius: 3, background: dashStep === i ? '#38bdf8' : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }} />
                  ))}
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {!isMobile && <div className="scroll-hint" style={{ textAlign: 'center', marginTop: 48, color: 'rgba(255,255,255,0.2)', fontSize: 20 }}>↓</div>}
      </div>

      {/* Problème */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '10px 20px 60px' : '30px 40px 100px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: 16 }}>LE PROBLÈME</p>
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 800, color: 'white', marginBottom: 18, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
              Ton cours ici. ChatGPT là. Un site d'exercices ailleurs.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, lineHeight: 1.8 }}>
              Aucun endroit ne te dit par où commencer, ni si tu progresses vraiment. Résultat : des heures de révision dispersées, sans réelle méthode.
            </p>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Zéro décision */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'center' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: 16 }}>ZÉRO DÉCISION</p>
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 800, color: 'white', marginBottom: 18, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
              Tu n'as rien à décider.<br />On s'en charge.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, lineHeight: 1.8, marginBottom: 22 }}>
              Pas de chapitre à choisir, pas de question à formuler. Novalys décide pour toi, chaque jour, ce qui mérite ton temps.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {['Quel chapitre travailler aujourd\'hui ?', 'Quel niveau d\'exercice choisir ?', 'Suis-je vraiment en retard ?', 'Comment formuler ma question à l\'IA ?'].map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>✗</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'line-through', textDecorationColor: 'rgba(255,255,255,0.15)' }}>{q}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic', borderLeft: '2px solid rgba(56,189,248,0.4)', paddingLeft: 14, lineHeight: 1.7 }}>
              Une IA classique répond à une question. Novalys construit ton parcours.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: 300, borderRadius: 16, overflow: 'hidden', background: '#0c1120', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 30px 70px rgba(0,0,0,0.4)' }}>
                <div style={{ background: '#10182c', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>Nova<span style={{ color: '#38bdf8' }}>lys</span></span>
                </div>
                <div style={{ padding: 24 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 8 }}>AUJOURD'HUI</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Salut Emma 👋</p>
                  <div style={{ fontSize: 30, textAlign: 'center', marginBottom: 12 }}>✏️</div>
                  <p style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: '0.06em', marginBottom: 8 }}>TON PROGRAMME DU JOUR</p>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 20 }}>Cinétique chimique</p>
                  <div style={{ background: 'white', color: '#070b18', textAlign: 'center', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
                    C'est parti →
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Centralisation */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: 16 }}>TOUT AU MÊME ENDROIT</p>
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.5px' }}>
              Un seul endroit. Un seul fil.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, lineHeight: 1.8, marginBottom: isMobile ? 36 : 56, maxWidth: 560, margin: isMobile ? '0 auto 36px' : '0 auto 56px' }}>
              Ce que tu apprends nourrit ce que tu révises. Ce que tu rates revient au bon moment.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: isMobile ? 10 : 0 }}>
              {['Cours', 'Fiche', 'Exercices', 'Suivi'].map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="card" style={{ borderRadius: 14, padding: isMobile ? '14px 20px' : '18px 26px', minWidth: isMobile ? 90 : 120 }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{String(i + 1).padStart(2, '0')}</p>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>{step}</p>
                  </div>
                  {i < 3 && <div style={{ width: isMobile ? 16 : 40, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Comment ça marche */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LA MÉTHODE</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: isMobile ? 36 : 56, letterSpacing: '-1px' }}>
              Comment ça marche.
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 32 : 44 }}>
            {[
              { num: '01', titre: 'Importe ton cours.', desc: 'Colle ton cours, prends une photo, ou upload un PDF. Novalys lit et comprend le contenu instantanément.' },
              { num: '02', titre: 'Reçois ta fiche.', desc: 'Une fiche de révision claire et structurée : points clés, formules, définitions, méthode.' },
              { num: '03', titre: "entraîne-toi avec des exercices personnalisés.", desc: 'Des exercices au format officiel du bac, calibrés à ton niveau exact, avec correction immédiate.' },
              { num: '04', titre: 'Suis ta progression.', desc: 'Visualise tes points forts et lacunes, chapitre par chapitre, et sache où concentrer tes efforts.' },
            ].map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.08}>
                <div className="step-line" style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>
                  <div style={{
                    width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 10, flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 12 : 14, fontWeight: 800, color: '#38bdf8'
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: isMobile ? 16 : 19, marginBottom: 8 }}>{step.titre}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 13 : 15, lineHeight: 1.7, maxWidth: 480 }}>{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Ce que Novalys sait de toi */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'center' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: 16 }}>LA MÉMOIRE</p>
            <h2 style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: 'white', marginBottom: 18, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
              Un chat oublie tout à la fin de la conversation.<br />Novalys, non.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, lineHeight: 1.8, marginBottom: 16 }}>
              Chaque chapitre travaillé, chaque erreur commise, chaque contrôle à venir — Novalys s'en souvient et construit ton suivi autour, jour après jour.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, lineHeight: 1.8 }}>
              Pas besoin de tout réexpliquer à chaque fois. Le contexte est déjà là.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="card" style={{ borderRadius: 16, padding: isMobile ? 20 : 28 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>CE QUE NOVALYS RETIENT</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Cinétique chimique', valeur: '62% maîtrisé' },
                  { label: 'Équilibres acido-basiques', valeur: '3 erreurs à revoir' },
                  { label: 'Série de révision', valeur: '7 jours d\'affilée' },
                  { label: 'Prochain contrôle', valeur: 'dans 4 jours' },
                  { label: 'Niveau scolaire', valeur: 'Terminale' },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', gap: 8
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{item.label}</span>
                    <span style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{item.valeur}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Programme complet */}
      <div id="programme" style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px 40px' : '100px 40px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LE PROGRAMME</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: '-1px' }}>
              Adapté à ton niveau.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: isMobile ? 14 : 16, marginBottom: 32 }}>
              De la Seconde à la Terminale, le programme complet couvert par Novalys.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
              {(['Seconde', 'Première', 'Terminale'] as const).map(n => (
                <button key={n} onClick={() => setNiveauActif(n)} style={{
                  padding: isMobile ? '9px 18px' : '10px 24px', borderRadius: 100, border: '1px solid', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  background: niveauActif === n ? 'white' : 'transparent',
                  color: niveauActif === n ? '#070b18' : 'rgba(255,255,255,0.5)',
                  borderColor: niveauActif === n ? 'white' : 'rgba(255,255,255,0.15)',
                }}>
                  {n}
                </button>
              ))}
            </div>

            <div className="card" style={{ borderRadius: 16, padding: isMobile ? 20 : 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : '10px 32px' }}>
                {programmeComplet[niveauActif].map((chap, i) => (
                  <div key={chap} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{chap}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Ticker chapitres */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '30px 0 60px' : '40px 0 100px' }}>
        <div className="marquee-wrap" style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(90deg, #070b18, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(-90deg, #070b18, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div className="marquee-track">
            {[...chapitresTicker, ...chapitresTicker].map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 100, padding: '9px 16px'
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7dd3fc' }}>{c.niveau}</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, whiteSpace: 'nowrap' }}>{c.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Démo produit */}
      <div id="démo" style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LA DÉMO</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: '-1px' }}>
              Vois Novalys en action.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: isMobile ? 14 : 16, marginBottom: 32 }}>
              Explore les fonctionnalités principales, directement ci-dessous.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab-btn" style={{
                  padding: isMobile ? '8px 14px' : '9px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#070b18' : 'rgba(255,255,255,0.5)',
                  borderColor: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.14)',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div style={{ background: '#0c1120', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#5f5f66' }} />)}
                </div>
                {!isMobile && (
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                    novalys.fr/{tabs.find(t => t.id === activeTab)?.url}
                  </div>
                )}
              </div>
              <div key={activeTab} style={{ background: '#0a0e1c', padding: isMobile ? 20 : 32, minHeight: 260, animation: 'tabFadeIn 0.3s ease' }}>
                {activeTab === 'fiche' && (
                  <div>
                    <p style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>FICHE DE RÉVISION</p>
                    <h3 style={{ color: 'white', fontWeight: 800, fontSize: isMobile ? 16 : 19, marginBottom: 16 }}>Cinétique chimique</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>POINTS CLÉS</p>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7 }}>La vitesse de réaction dépend de la concentration, la température et la présence d'un catalyseur.</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>FORMULES</p>
                        <p style={{ color: 'white', fontSize: 13, fontFamily: 'monospace', marginBottom: 6 }}>v = -d[A]/dt</p>
                        <p style={{ color: 'white', fontSize: 13, fontFamily: 'monospace' }}>t½ = ln(2)/k</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'exercice' && (
                  <div>
                    <p style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>QCM · NIVEAU INTERMÉDIAIRE</p>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: isMobile ? 14 : 15, marginBottom: 16, lineHeight: 1.5 }}>Quel facteur n'influence pas la vitesse de réaction ?</h3>
                    {[{ t: 'La température', c: false }, { t: 'La couleur du récipient', c: true }, { t: 'La concentration des réactifs', c: false }, { t: 'La présence d\'un catalyseur', c: false }].map((opt, i) => (
                      <div key={i} style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 8, fontSize: 13,
                        background: opt.c ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                        border: opt.c ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.06)',
                        color: opt.c ? '#7dd3fc' : 'rgba(255,255,255,0.55)'
                      }}>
                        {['A', 'B', 'C', 'D'][i]}. {opt.t} {opt.c && '✓'}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'planning' && (
                  <div>
                    <p style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>PLANNING DE LA SEMAINE</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { jour: 'Lundi', tache: 'Révision cours · Cinétique', done: true },
                        { jour: 'Mardi', tache: 'Exercices · Cinétique', done: true },
                        { jour: 'Mercredi', tache: 'Révision cours · Thermo', done: false },
                        { jour: 'Jeudi', tache: 'Exercices · Thermo', done: false },
                      ].map(item => (
                        <div key={item.jour} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '11px 14px' }}>
                          <div style={{ width: 60, color: '#38bdf8', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.jour}</div>
                          <div style={{ flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{item.tache}</div>
                          <span style={{ color: item.done ? '#7dd3fc' : 'rgba(255,255,255,0.2)', fontSize: 14 }}>{item.done ? '✓' : '○'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'controle' && (
                  <div>
                    <p style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>SUJET TYPE BAC · 2H</p>
                    <h3 style={{ color: 'white', fontWeight: 800, fontSize: isMobile ? 15 : 17, marginBottom: 16 }}>Bac Blanc — Physique-Chimie</h3>
                    {[
                      { num: 1, titre: 'Cinétique chimique', pts: 7 },
                      { num: 2, titre: 'Équilibres acido-basiques', pts: 7 },
                      { num: 3, titre: 'Synthèse', pts: 6 },
                    ].map(ex => (
                      <div key={ex.num} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '13px 14px', marginBottom: 8, gap: 8 }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Ex {ex.num} — {ex.titre}</p>
                        <span style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ex.pts} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Fonctionnalités */}
      <div id="fonctionnalités" style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LES OUTILS</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: '-1px' }}>
              Tout ce dont tu as besoin.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: isMobile ? 14 : 16, marginBottom: 40 }}>
              Un seul outil. Toute ta physique-chimie.
            </p>
          </AnimatedSection>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { title: 'Import multi-format', desc: 'Texte, photo ou PDF — l\'IA extrait et structure automatiquement.' },
              { title: 'Exercices adaptatifs', desc: 'Format officiel du bac, calibrés à ton niveau exact.' },
              { title: 'Correction intelligente', desc: 'Commentaire personnalisé sur chaque réponse ouverte.' },
              { title: 'Contrôle blanc', desc: 'Un sujet complet, format calibré, avec correction détaillée.' },
              { title: 'Analyse de copie', desc: 'Photographie ta copie corrigée pour des pistes ciblées.' },
              { title: 'Révision avant DS', desc: 'Un plan jour par jour, généré selon le temps restant.' },
              { title: 'Mémoire des erreurs', desc: 'Tes erreurs passées refont surface au bon moment.' },
              { title: 'Suivi de progression', desc: 'Tes forces et lacunes, chapitre par chapitre.' },
              { title: 'Séries et badges', desc: 'Reste motivé avec un suivi de régularité.' },
            ].map((f, idx) => (
              <AnimatedSection key={f.title} delay={idx * 0.03}>
                <div className="card-hover" style={{ background: '#070b18', padding: 22, height: '100%' }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Fondateur */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <AnimatedSection>
            <div className="card" style={{ borderRadius: 16, padding: isMobile ? 24 : 40 }}>
              <p className="eyebrow" style={{ marginBottom: 16 }}>LE FONDATEUR</p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  border: '1px dashed rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textAlign: 'center'
                }}>
                  Photo
                </div>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Louis, fondateur de Novalys</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Élève en classe préparatoire</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 14 : 15, lineHeight: 1.8, fontStyle: 'italic' }}>
                « Texte à venir : pourquoi j'ai créé Novalys, mon parcours, et ce que je veux t'apporter. »
              </p>
              <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 14px' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Vidéo à venir</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Comparatif prof particulier */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px 20px' : '100px 40px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AnimatedSection>
            <div className="card" style={{ borderRadius: 16, padding: isMobile ? 24 : 36, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>À TITRE DE COMPARAISON</p>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: isMobile ? 18 : 24, marginBottom: 24 }}>
                16 fois moins cher qu'un prof particulier.
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, maxWidth: 460, margin: '0 auto' }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 6 }}>Prof particulier</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 20 }}>~160€/mois</p>
                </div>
                <div style={{ border: '1px solid rgba(56,189,248,0.3)', borderRadius: 12, padding: 18 }}>
                  <p style={{ color: '#7dd3fc', fontSize: 12, marginBottom: 6 }}>Novalys Premium</p>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>9,99€/mois</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="divider" />

      {/* Tarifs */}
      <div id="tarifs" style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LES TARIFS</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: '-1px' }}>
              Simple et transparent.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: isMobile ? 14 : 16, marginBottom: 40 }}>
              Commence gratuitement. Passe Premium quand tu es prêt.
            </p>
          </AnimatedSection>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
            <AnimatedSection delay={0}>
              <div className="card" style={{ borderRadius: 16, padding: isMobile ? 26 : 32, height: '100%' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>GRATUIT</p>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 38, marginBottom: 4 }}>0€</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>Pour toujours</p>
                {['Import de cours (texte)', 'Fiches de révision par IA', 'Suivi de progression', 'Dashboard personnalisé'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>—</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f}</span>
                  </div>
                ))}
                <Link href="/inscription" className="btn-secondary" style={{ display: 'block', textAlign: 'center', fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 10, textDecoration: 'none', marginTop: 24 }}>
                  Commencer gratuitement
                </Link>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div style={{ borderRadius: 16, padding: isMobile ? 26 : 32, height: '100%', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 600 }}>PREMIUM</p>
                  <span style={{ background: '#38bdf8', color: '#070b18', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 800 }}>POPULAIRE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 38 }}>9,99€</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>/mois</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>Résiliable à tout moment</p>
                {['Tout le gratuit, plus :', 'Exercices adaptatifs illimités', 'Import photo & PDF (OCR)', 'Correction IA des réponses', 'Contrôle blanc & révision DS', 'Analyse de copies corrigées', 'Mémoire des erreurs'].map((f, i) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: i === 0 ? 'transparent' : '#38bdf8', fontSize: 13 }}>{i === 0 ? '' : '—'}</span>
                    <span style={{ color: i === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)', fontSize: 13, fontStyle: i === 0 ? 'italic' : 'normal' }}>{f}</span>
                  </div>
                ))}
                <Link href="/inscription" className="btn-primary" style={{ display: 'block', textAlign: 'center', fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 10, textDecoration: 'none', marginTop: 24 }}>
                  Essayer Premium
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* FAQ */}
      <div id="faq" style={{ position: 'relative', zIndex: 2, padding: isMobile ? '60px 20px' : '100px 40px 100px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>QUESTIONS</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: isMobile ? 36 : 56, letterSpacing: '-1px' }}>
              Questions fréquentes.
            </h2>
          </AnimatedSection>
          <FAQSection isMobile={isMobile} />
        </div>
      </div>

      {/* CTA final */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '20px 20px 60px' : '40px 40px 100px', textAlign: 'center' }}>
        <AnimatedSection>
          <div className="card" style={{ maxWidth: 680, margin: '0 auto', borderRadius: 20, padding: isMobile ? '40px 24px' : '56px 40px' }}>
            <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-1px', lineHeight: 1.25 }}>
              Arrête de t'organiser seul.<br />
              <span className="shimmer">Laisse Novalys s'en charger.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 14 : 16, marginBottom: 32 }}>Rejoins les élèves qui révisent intelligemment.</p>
            <MagneticLink href="/inscription" className="btn-primary" style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, padding: isMobile ? '14px 32px' : '16px 40px', borderRadius: 12, textDecoration: 'none' }}>
              Créer mon compte gratuitement
            </MagneticLink>
          </div>
        </AnimatedSection>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '28px 20px' : '36px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2026 Novalys</p>
        <div style={{ display: 'flex', gap: isMobile ? 14 : 24, flexWrap: 'wrap' }}>
          <Link href="/contact" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>Contact</Link>
          <Link href="/mentions-legales" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/cgv" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>CGV</Link>
          <Link href="/inscription" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>S'inscrire</Link>
        </div>
      </div>
    </div>
  )
}

function FAQSection({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "Novalys fonctionne pour quels niveaux ?", r: "Novalys est disponible pour la Seconde, la Première et la Terminale, avec des fiches et exercices adaptés au programme exact de chaque classe." },
    { q: "Comment fonctionne la génération de fiches ?", r: "Tu importes ton cours (texte, photo ou PDF), l'IA analyse le contenu et génère automatiquement une fiche structurée." },
    { q: "Les exercices sont-ils vraiment adaptés à mon niveau ?", r: "Oui — les exercices sont générés en tenant compte du programme officiel de ta classe et du niveau de difficulté que tu choisis." },
    { q: "Mes données sont-elles sécurisées ?", r: "Oui. Tes cours et résultats sont stockés de façon sécurisée et chiffrée. Seul toi y as accès." },
    { q: "Comment fonctionne la révision avant un contrôle ?", r: "Indique la date de ton contrôle et le chapitre concerné, Novalys génère un plan de révision jour par jour." },
    { q: "Est-ce que je peux annuler à tout moment ?", r: "Oui, sans engagement, directement depuis ton profil." },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {faqs.map((faq, i) => (
        <AnimatedSection key={i} delay={i * 0.04}>
          <div className="card card-hover" style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
            <div style={{ padding: isMobile ? '16px 18px' : '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>{faq.q}</span>
              <span style={{ color: '#38bdf8', fontSize: 18, flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>+</span>
            </div>
            {open === i && (
              <div style={{ padding: isMobile ? '0 18px 16px' : '0 22px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8, paddingTop: 14 }}>{faq.r}</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      ))}
    </div>
  )
}
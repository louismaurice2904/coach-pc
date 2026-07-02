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
      transform: inView ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
    }}>
      {children}
    </div>
  )
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handle = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <div style={{ background: '#060d2e', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes noise {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-1%,-1%)}
          20%{transform:translate(1%,1%)}
          30%{transform:translate(-1%,1%)}
          40%{transform:translate(1%,-1%)}
          50%{transform:translate(-1%,0)}
          60%{transform:translate(1%,0)}
          70%{transform:translate(0,-1%)}
          80%{transform:translate(0,1%)}
          90%{transform:translate(-1%,1%)}
        }
        .shimmer {
          background: linear-gradient(90deg, #fff 0%, #60a5fa 40%, #a78bfa 60%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .glow-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 0 30px rgba(99,102,241,0.5);
          transition: all 0.3s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 50px rgba(99,102,241,0.8);
          transform: scale(1.05);
        }
        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(99,102,241,0.4) !important;
        }
        .noise {
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          animation: noise 0.5s steps(2) infinite;
        }
      `}</style>

      {/* Texture noise */}
      <div className="noise" />

      {/* Blobs animés */}
      <div style={{
        position: 'fixed', top: -200, right: -200, width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        transform: `translateY(${scrollY * 0.2}px)`
      }} />
      <div style={{
        position: 'fixed', bottom: -200, left: -200, width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        transform: `translateY(${-scrollY * 0.15}px)`
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
        background: scrollY > 50 ? 'rgba(6,13,46,0.9)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>
          Coach<span style={{ color: '#818cf8' }}>PC</span>
        </span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Fonctionnalités', 'Tarifs', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
            >{item}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/connexion" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>
            Se connecter
          </Link>
          <Link href="/inscription" className="glow-btn" style={{
            color: 'white', fontSize: 14, fontWeight: 700, padding: '10px 20px',
            borderRadius: 12, textDecoration: 'none'
          }}>
            Essai gratuit →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

          {/* Texte */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 100, padding: '6px 16px', marginBottom: 32
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
              <span style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>PHYSIQUE-CHIMIE · BAC 2026</span>
            </div>

            <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-2px' }}>
              <span style={{ color: 'white' }}>Arrête de</span><br />
              <span style={{ color: 'white' }}>réviser</span>{' '}
              <span className="shimmer">dans le vide.</span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              CoachPC analyse tes cours, génère tes fiches, crée tes exercices et planifie tes révisions — automatiquement, jusqu'au bac.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/inscription" className="glow-btn" style={{
                color: 'white', fontWeight: 700, fontSize: 16, padding: '16px 32px',
                borderRadius: 14, textDecoration: 'none', display: 'inline-block'
              }}>
                Commencer gratuitement →
              </Link>
              <Link href="/connexion" style={{
                color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 16, padding: '16px 32px',
                borderRadius: 14, textDecoration: 'none', display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s'
              }}>
                J'ai déjà un compte
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
              {[
                { value: '12', label: 'chapitres du programme' },
                { value: '100%', label: 'conforme au bac' },
                { value: '0€', label: 'pour démarrer' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 2 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock-up app */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'float 4s ease-in-out infinite' }}>
            <div style={{
              width: 340, borderRadius: 24, overflow: 'hidden',
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              {/* Barre du haut */}
              <div style={{ background: '#1a237e', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Coach<span style={{ color: '#818cf8' }}>PC</span></span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
              </div>
              {/* Contenu mock */}
              <div style={{ padding: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>TABLEAU DE BORD</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Bonjour Emma 👋</p>

                {/* Countdown */}
                <div style={{ background: 'linear-gradient(135deg, #1565c0, #7c3aed)', borderRadius: 12, padding: 14, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Jours avant le bac</p>
                    <p style={{ color: 'white', fontWeight: 900, fontSize: 28 }}>47</p>
                  </div>
                  <span style={{ fontSize: 28 }}>⏱️</span>
                </div>

                {/* Progression */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Progression globale</span>
                    <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>67%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 6 }}>
                    <div style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 99, height: 6, width: '67%', boxShadow: '0 0 8px #3b82f6' }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Cours', value: '8', color: '#3b82f6' },
                    { label: 'Exercices', value: '34', color: '#22c55e' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10 }}>
                      <p style={{ color: s.color, fontWeight: 900, fontSize: 20 }}>{s.value}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Conseil */}
                <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 10, padding: 10 }}>
                  <p style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700, marginBottom: 3 }}>💡 Conseil du jour</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.5 }}>Révise la cinétique chimique avant ton DS de vendredi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="fonctionnalités" style={{ position: 'relative', zIndex: 2, padding: '80px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <AnimatedSection>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
              Tout ce dont tu as besoin
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: 18, marginBottom: 60 }}>
              Un seul outil. Toute ta physique-chimie.
            </p>
          </AnimatedSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '📚', title: 'Import de cours', desc: 'Colle ton cours ou prends une photo. Une fiche claire et structurée est générée en quelques secondes.', color: '#3b82f6', delay: 0 },
              { icon: '✏️', title: 'Exercices adaptatifs', desc: 'Des exercices au format bac, calibrés à ton niveau, qui s\'ajustent selon tes erreurs.', color: '#8b5cf6', delay: 0.1 },
              { icon: '📈', title: 'Suivi de progression', desc: 'Visualise tes forces et lacunes chapitre par chapitre. Sache exactement où tu en es.', color: '#22c55e', delay: 0.2 },
              { icon: '📅', title: 'Planning intelligent', desc: 'Un planning personnalisé chaque semaine selon ton temps disponible et tes objectifs.', color: '#f59e0b', delay: 0.3 },
              { icon: '🔔', title: 'Notifications', desc: 'Rappels intelligents si tu ne travailles pas assez. Ton coach ne te laisse pas décrocher.', color: '#ef4444', delay: 0.4 },
              { icon: '🖨️', title: 'Impression des fiches', desc: 'Imprime tes fiches de révision en un clic, avec une mise en page optimisée pour le papier.', color: '#06b6d4', delay: 0.5 },
            ].map((f) => (
              <AnimatedSection key={f.title} delay={f.delay}>
                <div className="glass card-hover" style={{ borderRadius: 20, padding: 28, height: '100%' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${f.color}20`, border: `1px solid ${f.color}40`, fontSize: 22, marginBottom: 16
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Tarifs */}
      <div id="tarifs" style={{ position: 'relative', zIndex: 2, padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimatedSection>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
              Tarifs simples
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: 18, marginBottom: 60 }}>
              Commence gratuitement. Passe Premium quand tu es prêt.
            </p>
          </AnimatedSection>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Gratuit */}
            <AnimatedSection delay={0}>
              <div className="glass" style={{ borderRadius: 24, padding: 36, height: '100%' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>GRATUIT</p>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 48, marginBottom: 4 }}>0€</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>Pour toujours</p>
                {['Import de cours (texte)', 'Fiches de révision basiques', 'Suivi de progression', 'Dashboard personnalisé'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
                <Link href="/inscription" style={{
                  display: 'block', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 15,
                  padding: '14px', borderRadius: 12, textDecoration: 'none', marginTop: 32,
                  border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s'
                }}>
                  Commencer gratuitement
                </Link>
              </div>
            </AnimatedSection>

            {/* Premium */}
            <AnimatedSection delay={0.1}>
              <div style={{
                borderRadius: 24, padding: 36, height: '100%', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
                border: '1px solid rgba(99,102,241,0.5)',
                boxShadow: '0 0 60px rgba(99,102,241,0.2)'
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  borderRadius: 100, padding: '4px 12px',
                  color: 'white', fontSize: 11, fontWeight: 700
                }}>
                  LE PLUS POPULAIRE
                </div>
                <p style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>PREMIUM</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <p style={{ color: 'white', fontWeight: 900, fontSize: 48 }}>9€</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>/mois</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>Résiliable à tout moment</p>
                {[
                  'Tout le gratuit, plus :',
                  'Génération IA de fiches complètes',
                  'Exercices adaptatifs illimités',
                  'Import par photo (OCR)',
                  'Planning hebdomadaire IA',
                  'Notifications intelligentes',
                  'Impression optimisée des fiches',
                  'Analyse de tes copies de DS',
                ].map((f, i) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ color: i === 0 ? 'transparent' : '#818cf8', fontSize: 16 }}>{i === 0 ? '' : '✓'}</span>
                    <span style={{ color: i === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: i === 0 ? 500 : 400, fontStyle: i === 0 ? 'italic' : 'normal' }}>{f}</span>
                  </div>
                ))}
                <Link href="/inscription" className="glow-btn" style={{
                  display: 'block', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 15,
                  padding: '14px', borderRadius: 12, textDecoration: 'none', marginTop: 32
                }}>
                  Essayer Premium gratuitement →
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ position: 'relative', zIndex: 2, padding: '80px 40px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <AnimatedSection>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 60, letterSpacing: '-1px' }}>
              Questions fréquentes
            </h2>
          </AnimatedSection>
          <FAQSection />
        </div>
      </div>

      {/* CTA final */}
      <div style={{ position: 'relative', zIndex: 2, padding: '80px 40px', textAlign: 'center' }}>
        <AnimatedSection>
          <div className="glass" style={{ maxWidth: 700, margin: '0 auto', borderRadius: 32, padding: '60px 40px' }}>
            <h2 style={{ fontSize: 52, fontWeight: 900, color: 'white', marginBottom: 16, letterSpacing: '-1px' }}>
              Prêt à <span className="shimmer">progresser</span> ?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginBottom: 40 }}>
              Rejoins les élèves qui révisent intelligemment.
            </p>
            <Link href="/inscription" className="glow-btn" style={{
              display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 18,
              padding: '18px 48px', borderRadius: 16, textDecoration: 'none'
            }}>
              Créer mon compte gratuitement →
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2, padding: '40px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          © 2026 CoachPC · Fait avec ❤️ pour les lycéens français
        </p>
      </div>
    </div>
  )
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "Comment fonctionne la génération de fiches ?", r: "Tu importes ton cours en le collant dans l'application. L'IA analyse le contenu et génère automatiquement une fiche structurée avec les notions clés, formules et résumés. Disponible en version Premium." },
    { q: "Les exercices sont-ils vraiment adaptés au bac ?", r: "Oui — les exercices sont générés en tenant compte du format officiel du bac de physique-chimie, avec des questions de cours, des applications numériques et des exercices type DS." },
    { q: "Puis-je importer des cours par photo ?", r: "La fonctionnalité d'import par photo est disponible en version Premium. Pour l'instant, tu peux coller le texte de ton cours directement dans l'application." },
    { q: "Mes données sont-elles sécurisées ?", r: "Oui. Tes cours et résultats sont stockés de façon sécurisée et ne sont accessibles que par toi. Nous utilisons Supabase, une infrastructure de niveau professionnel chiffrée." },
    { q: "Comment fonctionne le planning hebdomadaire ?", r: "Chaque semaine, l'application calcule un planning personnalisé selon ton temps disponible, tes chapitres restants et tes objectifs. Tu reçois une notification chaque lundi matin." },
    { q: "Est-ce que je peux annuler à tout moment ?", r: "Oui, sans engagement. Tu peux résilier ton abonnement Premium à tout moment depuis ton profil. Tu conserves l'accès jusqu'à la fin de la période payée." },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {faqs.map((faq, i) => (
        <AnimatedSection key={i} delay={i * 0.05}>
          <div className="glass card-hover" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{faq.q}</span>
              <span style={{
                color: '#818cf8', fontSize: 20, fontWeight: 300, marginLeft: 16, flexShrink: 0,
                transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s'
              }}>+</span>
            </div>
            {open === i && (
              <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.8, paddingTop: 16 }}>{faq.r}</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      ))}
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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

export default function Parents() {
  const isMobile = useIsMobile()
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const faqs = [
    { q: "Novalys donne-t-il juste les réponses aux exercices ?", r: "Non, c'est exactement l'inverse de la philosophie du produit. Chaque correction explique le raisonnement, pas juste le résultat. Le mode \"Explique-moi ça\" demande même à l'élève de reformuler une notion avec ses propres mots — impossible de tricher sur la compréhension réelle." },
    { q: "Les données de mon enfant sont-elles en sécurité ?", r: "Oui. Les cours, résultats et informations personnelles sont stockés de façon chiffrée et sécurisée. Aucune donnée n'est revendue à des tiers." },
    { q: "Puis-je annuler l'abonnement à tout moment ?", r: "Oui, sans engagement ni frais cachés, directement depuis le compte de votre enfant." },
    { q: "Est-ce que je peux suivre les progrès de mon enfant ?", r: "Si votre enfant choisit d'activer le partage, vous recevrez un résumé hebdomadaire de son activité et de sa progression par email. C'est une option activée par l'élève lui-même, pas une surveillance imposée." },
    { q: "Novalys remplace-t-il un vrai professeur ?", r: "Non, Novalys est un outil de structuration et de révision — il organise le travail et corrige avec pédagogie, mais ne remplace pas l'enseignement en classe. C'est un complément, pensé pour la maison." },
  ]

  return (
    <div style={{ background: '#070b18', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100%; }
        .card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); }
        .card-hover { transition: border-color 0.25s ease; }
        .card-hover:hover { border-color: rgba(255,255,255,0.2); }
        .btn-primary { background: #fff; color: #070b18; transition: opacity 0.2s ease; }
        .btn-primary:hover { opacity: 0.85; }
        .eyebrow { color: #38bdf8; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 auto; max-width: 640px; }
      `}</style>

      <div style={{ position: 'fixed', top: -240, right: -200, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav simple */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, padding: isMobile ? '0 16px' : '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
        background: 'rgba(7,11,24,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Novalys" style={{ height: 26 }} />
        </Link>
        <Link href="/inscription" className="btn-primary" style={{
          fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 10, textDecoration: 'none'
        }}>
          Inscrire mon enfant
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>ESPACE PARENTS</p>
          <h1 style={{ fontSize: isMobile ? 30 : 46, fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
            Ce que fait vraiment Novalys pour votre enfant.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 15 : 17, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            Un outil de révision pensé pour la physique-chimie au lycée — pas un raccourci pour éviter de travailler, mais une méthode pour vraiment progresser.
          </p>
        </div>
      </div>

      <div className="divider" />

      {/* Ce n'est pas "juste les réponses" */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>LA VRAIE QUESTION</p>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 20, letterSpacing: '-0.5px' }}>
            "Est-ce que ça donne juste les réponses ?"
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.8, textAlign: 'center', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            C'est la première question que se pose tout parent — et c'est la bonne question. Voici comment Novalys y répond concrètement.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {[
              { titre: 'Correction qui explique le pourquoi', desc: 'Chaque réponse corrigée par IA vient avec un commentaire sur ce qui est juste, ce qui manque, et pourquoi — jamais juste "faux, réessaie".' },
              { titre: 'Mode "Explique-moi ça"', desc: 'L\'élève doit reformuler une notion avec ses propres mots, comme s\'il l\'enseignait. Impossible de simuler la compréhension.' },
              { titre: 'Suivi de progression réel', desc: 'Les scores viennent des vrais exercices faits, pas d\'une auto-évaluation — la progression affichée reflète le travail effectif.' },
              { titre: 'Zéro raccourci sur le programme', desc: 'Le contenu suit strictement le programme officiel du niveau de l\'élève, sans notions hors-sujet ni simplifications trompeuses.' },
            ].map(item => (
              <div key={item.titre} className="card card-hover" style={{ borderRadius: 16, padding: 22 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.titre}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Comparatif prix */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="card" style={{ borderRadius: 20, padding: isMobile ? 26 : 40, textAlign: 'center' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>LE BUDGET</p>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'white', marginBottom: 28 }}>
              18 fois moins cher qu'un prof particulier.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, maxWidth: 460, margin: '0 auto' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>Prof particulier</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 24 }}>~160€/mois</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>1h par semaine</p>
              </div>
              <div style={{ border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, padding: 22 }}>
                <p style={{ color: '#7dd3fc', fontSize: 13, marginBottom: 8 }}>Novalys Premium</p>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 24 }}>9,99€/mois</p>
                <p style={{ color: '#86efac', fontSize: 12, marginTop: 8 }}>Disponible 24h/24, sans engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

            {/* Transparence */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 48, alignItems: 'center' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 16 }}>LA TRANSPARENCE</p>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.5px' }}>
              Un résumé, si votre enfant le souhaite.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8 }}>
              Novalys n'espionne personne. Si votre enfant choisit d'activer le partage depuis son propre compte, vous recevez un résumé hebdomadaire de son activité — dans une logique de confiance partagée, pas de contrôle imposé à son insu.
            </p>
          </div>
          <div className="card" style={{ borderRadius: 16, padding: 24 }}>
            <p style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 14 }}>EXEMPLE DE RÉSUMÉ HEBDOMADAIRE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Sessions cette semaine', valeur: '5' },
                { label: 'Chapitre travaillé', valeur: 'Cinétique chimique' },
                { label: 'Score moyen', valeur: '74%' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{item.valeur}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Fondateur */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="card" style={{ borderRadius: 16, padding: isMobile ? 24 : 36 }}>
            <p className="eyebrow" style={{ marginBottom: 16 }}>QUI EST DERRIÈRE NOVALYS</p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
              <img src="/louis.png.png" alt="Louis, fondateur de Novalys" style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)'
              }} />
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Louis, fondateur de Novalys</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Ancien lycéen, aujourd'hui en classe préparatoire</p>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8 }}>
              Novalys est né d'une frustration très concrète. En Terminale, j'utilisais déjà l'intelligence artificielle pour réviser ma physique-chimie — mais c'était laborieux : aucune mémoire d'une session à l'autre, aucun suivi réel, il fallait tout reconstruire à chaque fois. Je me suis dit qu'il fallait un vrai système qui centralise tout ça, avec une mémoire de progression digne de ce nom.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, marginTop: 14 }}>
              Je suis passé de 13 à 16 en physique-chimie entre le début et la fin de l'année, avec mention très bien au bac — et 20 au grand oral, sur un sujet de physique. Aujourd'hui en classe préparatoire, je continue de croire qu'un cadre clair et un vrai suivi font toute la différence pour un élève qui se sent perdu face à la masse de travail à fournir. C'est exactement ce que Novalys essaie d'apporter.
            </p>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* FAQ parents */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '50px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>QUESTIONS FRÉQUENTES</p>
          <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 40, letterSpacing: '-0.5px' }}>
            Ce que les parents demandent le plus.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card card-hover" style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div style={{ padding: isMobile ? '16px 18px' : '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>{faq.q}</span>
                  <span style={{ color: '#38bdf8', fontSize: 18, flexShrink: 0, transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>+</span>
                </div>
                {faqOpen === i && (
                  <div style={{ padding: isMobile ? '0 18px 16px' : '0 22px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8, paddingTop: 14 }}>{faq.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '20px 20px 60px' : '40px 40px 90px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', borderRadius: 20, padding: isMobile ? '36px 24px' : '48px 40px' }}>
          <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'white', marginBottom: 14 }}>
            Prêt à essayer avec votre enfant ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 }}>
            7 jours d'essai Premium gratuit, sans engagement.
          </p>
          <Link href="/inscription" className="btn-primary" style={{
            fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 12, textDecoration: 'none', display: 'inline-block'
          }}>
            Créer un compte
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '24px 20px' : '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2026 Novalys</p>
      </div>
    </div>
  )
}
import Link from 'next/link'

export default function Changelog() {
  const updates = [
    {
      version: 'v1.3', date: '5 juillet 2026', tag: 'Nouveau',
      changes: [
        'Système de streaks quotidiens — reviens chaque jour pour maintenir ta flamme 🔥',
        'Badges débloquables selon ta progression',
        'Notifications toast sur toutes les actions',
        'Navigation mobile avec menu hamburger',
        'Notes personnelles sur chaque chapitre',
        'Page Changelog et Mentions légales',
      ]
    },
    {
      version: 'v1.2', date: '1 juillet 2026', tag: 'Design',
      changes: [
        'Refonte complète de l\'interface — dark mode premium sur toutes les pages',
        'Logo CoachPC avec icône atome',
        'Animations au scroll sur la page d\'accueil',
        'Mock-up dynamique du dashboard sur la landing',
        'Page 404 personnalisée',
      ]
    },
    {
      version: 'v1.1', date: '25 juin 2026', tag: 'Fonctionnalités',
      changes: [
        'Planning hebdomadaire personnalisé avec bouton d\'impression',
        'Impression des fiches de révision',
        'Page admin pour gérer les messages et la FAQ',
        'Formulaire de contact avec stockage en base',
        'Page "Mes cours" avec suppression',
      ]
    },
    {
      version: 'v1.0', date: '20 juin 2026', tag: 'Lancement',
      changes: [
        'Lancement de CoachPC 🚀',
        'Inscription, connexion et profil élève',
        'Import de cours par copier-coller',
        'Fiches de révision',
        'Tableau de progression par chapitre',
        'Dashboard avec compte à rebours et conseil du jour',
      ]
    },
  ]

  const tagColors: Record<string, string> = {
    'Nouveau': 'rgba(99,102,241,0.8)',
    'Design': 'rgba(139,92,246,0.8)',
    'Fonctionnalités': 'rgba(59,130,246,0.8)',
    'Lancement': 'rgba(34,197,94,0.8)',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060d2e' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
      `}</style>
      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>🆕 Nouveautés</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 40, fontFamily: 'Inter, sans-serif' }}>Toutes les mises à jour de CoachPC.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {updates.map((update, i) => (
            <div key={i} style={{ display: 'flex', gap: 20 }}>
              {/* Ligne verticale timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 0 12px rgba(99,102,241,0.6)'
                }} />
                {i < updates.length - 1 && (
                  <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 8 }} />
                )}
              </div>

              {/* Carte */}
              <div className="glass" style={{ borderRadius: 20, padding: 24, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{update.version}</span>
                  <span style={{
                    background: tagColors[update.tag],
                    borderRadius: 100, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif'
                  }}>{update.tag}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 'auto', fontFamily: 'Inter, sans-serif' }}>{update.date}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {update.changes.map((change, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#818cf8', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✦</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
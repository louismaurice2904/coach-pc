'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useState, useRef, useEffect } from 'react'

const ADMIN_EMAIL = 'louismaurice2904@gmail.com'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const mainLinks = [
  { href: '/aujourdhui', label: "🎯 Aujourd'hui" },
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/mes-cours', label: 'Mes cours' },
  { href: '/progression', label: 'Progression' },
]

const toolLinks = [
  { href: '/simulateur', label: '⏱️ Simulateur jour J', desc: 'Conditions réelles d\'examen, minuterie stricte' },
  { href: '/feynman', label: '🎓 Explique-moi ça', desc: 'Teste ta compréhension en expliquant avec tes mots' },
  { href: '/flashcards', label: '🗂️ Flashcards', desc: 'Révise formules et définitions avec des cartes' },
  { href: '/fiche', label: '📋 Fiches', desc: 'Tes fiches de révision par chapitre' },
  { href: '/exercices', label: '✏️ Exercices', desc: 'Entraîne-toi avec des exercices adaptatifs' },
  { href: '/planning', label: '📅 Planning', desc: 'Ton planning hebdomadaire' },
  { href: '/revisions', label: '🧠 Révisions', desc: 'Retravaille tes erreurs passées' },
  { href: '/controles', label: '🎯 Réviser un DS', desc: 'Plan de révision avant un contrôle' },
  { href: '/bac-blanc', label: '📝 Sujet type', desc: 'Génère un sujet complet type bac' },
  { href: '/evaluation', label: '🔍 Analyser ma copie', desc: 'Analyse ta copie corrigée par le prof' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)
    const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === ADMIN_EMAIL) setIsAdmin(true)
    }
    check()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDeconnexion = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  const isAuthPage = pathname === '/' || pathname === '/connexion' || pathname === '/inscription' || pathname === '/parents'
  if (isAuthPage) return null

  const isToolActive = toolLinks.some(l => l.href === pathname)

  return (
    <>
      <style>{`
        .nav-desktop { display: flex; }
        .nav-right { display: flex; }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-right { display: none !important; }
          .hamburger { display: flex !important; }
        }
        .nav-link:hover { color: white !important; background: rgba(255,255,255,0.06) !important; }
        .tool-item:hover { background: rgba(99,102,241,0.12) !important; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, padding: '0 20px',
        display: 'flex', alignItems: 'center', height: 60,
        background: 'rgba(6,13,46,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Link href="/aujourdhui" style={{ textDecoration: 'none', marginRight: 20, flexShrink: 0 }}>
          <img src="/logo.svg" alt="Novalys" style={{ height: 28 }} />
        </Link>

        <div className="nav-desktop" style={{ flex: 1, gap: 2, alignItems: 'center' }}>
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} className="nav-link" style={{
              fontSize: 13, fontWeight: 500, padding: '6px 10px', borderRadius: 8,
              textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
              color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.5)',
              background: pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: pathname === link.href ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
            }}>
              {link.label}
            </Link>
          ))}

          {/* Menu Plus d'outils */}
          <div ref={toolsRef} style={{ position: 'relative' }}>
            <button onClick={() => setToolsOpen(!toolsOpen)} className="nav-link" style={{
              fontSize: 13, fontWeight: 500, padding: '6px 10px', borderRadius: 8,
              background: isToolActive || toolsOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: isToolActive || toolsOpen ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              color: isToolActive ? 'white' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4
            }}>
              ⚙️ Plus d'outils
              <span style={{ fontSize: 10, transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
            </button>

            {toolsOpen && (
              <div style={{
                position: 'absolute', top: 44, left: 0, width: 320, zIndex: 200,
                background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                padding: 8, boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'dropIn 0.2s ease'
              }}>
                {toolLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setToolsOpen(false)} className="tool-item" style={{
                    display: 'block', padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                    background: pathname === link.href ? 'rgba(99,102,241,0.15)' : 'transparent',
                    transition: 'background 0.15s'
                  }}>
                    <p style={{ color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
                      {link.label}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                      {link.desc}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

              <div className="nav-right" style={{ gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          {isAdmin && (
            <Link href="/admin" className="nav-link" style={{
              fontSize: 13, color: pathname === '/admin' ? 'white' : '#7dd3fc', textDecoration: 'none',
              padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s',
              background: pathname === '/admin' ? 'rgba(56,189,248,0.15)' : 'transparent'
            }}>
              ⚙️ Admin
            </Link>
          )}
          <Link href="/profil" className="nav-link" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s'
          }}>
            Mon profil
          </Link>
          <Link href="/changelog" className="nav-link" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s'
          }}>
            Nouveautés
          </Link>
          <button onClick={handleDeconnexion} className="nav-link" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none',
            border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
            transition: 'all 0.2s', fontFamily: 'inherit'
          }}>
            Déconnexion
          </button>
        </div>

        <button
          className="hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, flexDirection: 'column', gap: 5,
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div style={{ width: 22, height: 2, background: 'white', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: 'white', borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: 'opacity 0.3s' }} />
          <div style={{ width: 22, height: 2, background: 'white', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </nav>

      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99,
          background: 'rgba(6,13,46,0.99)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px 24px', maxHeight: '80vh', overflowY: 'auto'
        }}>
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{
              display: 'block', padding: '12px 16px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 15, fontWeight: 600,
              color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.6)',
              background: pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}>
              {link.label}
            </Link>
          ))}

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '16px 16px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
            PLUS D'OUTILS
          </p>
          {toolLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{
              display: 'block', padding: '10px 16px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.55)',
              background: pathname === link.href ? 'rgba(99,102,241,0.15)' : 'transparent',
            }}>
              {link.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 12 }}>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 16px', color: '#7dd3fc', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>⚙️ Admin</Link>
            )}
            <Link href="/profil" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>Mon profil</Link>
            <Link href="/changelog" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>Nouveautés</Link>
            <button onClick={handleDeconnexion} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', color: 'rgba(239,68,68,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Déconnexion</button>
          </div>
        </div>
      )}
    </>
  )
}
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const links = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/mes-cours', label: 'Mes cours' },
  { href: '/fiche', label: 'Fiches' },
  { href: '/exercices', label: 'Exercices' },
  { href: '/planning', label: 'Planning' },
  { href: '/progression', label: 'Progression' },
  { href: '/contact', label: 'Contact' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDeconnexion = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  const isAuthPage = pathname === '/' || pathname === '/connexion' || pathname === '/inscription'
  if (isAuthPage) return null

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
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, padding: '0 20px',
        display: 'flex', alignItems: 'center', height: 60,
        background: 'rgba(6,13,46,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', marginRight: 20, flexShrink: 0 }}>
          <img src="/logo.svg" alt="CoachPC" style={{ height: 28 }} />
        </Link>

        {/* Liens desktop */}
        <div className="nav-desktop" style={{ flex: 1, gap: 2, alignItems: 'center' }}>
          {links.map(link => (
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
        </div>

        {/* Droite desktop */}
        <div className="nav-right" style={{ gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <Link href="/profil" className="nav-link" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s'
          }}>
            Mon profil
          </Link>
          <button onClick={handleDeconnexion} className="nav-link" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none',
            border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
            transition: 'all 0.2s', fontFamily: 'inherit'
          }}>
            Déconnexion
            <Link href="/changelog" className="nav-link" style={{
  fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
  padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s'
}}>
  Nouveautés
</Link>
          </button>
        </div>

        {/* Hamburger mobile */}
        <button
          className="hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, flexDirection: 'column', gap: 5,
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div style={{
            width: 22, height: 2, background: 'white', borderRadius: 2,
            transition: 'all 0.3s',
            transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : 'none'
          }} />
          <div style={{
            width: 22, height: 2, background: 'white', borderRadius: 2,
            opacity: mobileOpen ? 0 : 1, transition: 'opacity 0.3s'
          }} />
          <div style={{
            width: 22, height: 2, background: 'white', borderRadius: 2,
            transition: 'all 0.3s',
            transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none'
          }} />
        </button>
      </nav>

      {/* Menu mobile ouvert */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99,
          background: 'rgba(6,13,46,0.99)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px 24px'
        }}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: 15, fontWeight: 600,
                color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.6)',
                background: pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 8 }}>
            <Link
              href="/profil"
              onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}
            >
              Mon profil
            </Link>
            <button
              onClick={handleDeconnexion}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 16px', color: 'rgba(239,68,68,0.8)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontFamily: 'inherit'
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  )
}
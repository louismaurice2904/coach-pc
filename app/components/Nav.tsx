'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const links = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/mes-cours', label: 'Mes cours' },
  { href: '/fiche', label: 'Fiches' },
  { href: '/planning', label: 'Planning' },
  { href: '/progression', label: 'Progression' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleDeconnexion = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  const isAuthPage = pathname === '/' || pathname === '/connexion' || pathname === '/inscription'

  if (isAuthPage) return null

  return (
    <nav style={{ backgroundColor: '#1a237e' }} className="px-8 py-0 flex items-center gap-8 shadow-md">
      <Link href="/dashboard" className="text-white font-bold text-lg py-4 mr-4 tracking-tight">
        CoachPC
      </Link>
      <div className="flex gap-1 flex-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium px-4 py-4 transition border-b-2 ${
              pathname === link.href
                ? 'text-white border-white'
                : 'text-blue-200 border-transparent hover:text-white hover:border-blue-300'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/profil" className="text-sm text-blue-200 hover:text-white transition py-4 mr-2">
  Mon profil
</Link>
      </div>
      <button
        onClick={handleDeconnexion}
        className="text-sm text-blue-200 hover:text-white transition py-4"
      >
        Déconnexion
      </button>
    </nav>
  )
}
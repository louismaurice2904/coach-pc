'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnexion = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage('Email ou mot de passe incorrect.') }
    else { window.location.href = '/dashboard' }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        input {
          background: rgba(255,255,255,0.08) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: white !important;
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          outline: none;
          font-size: 14px;
          transition: border 0.2s;
        }
        input::placeholder { color: rgba(255,255,255,0.4); }
        input:focus { border-color: rgba(66,165,245,0.8) !important; }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="w-full max-w-md px-4 relative">
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div className="text-center mb-8">
            <p className="text-3xl mb-2">👋</p>
            <h1 className="text-2xl font-bold text-white">Content de te revoir</h1>
            <p className="text-blue-200 text-sm mt-1">Connecte-toi pour continuer à réviser</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
              <input type="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Mot de passe</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button
            onClick={handleConnexion}
            disabled={loading}
            className="w-full text-white text-sm font-bold py-3 rounded-xl transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>

          {message && <p className="mt-4 text-center text-sm text-red-300">{message}</p>}

          <p className="text-center text-sm text-blue-300 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="text-white font-semibold hover:underline">
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
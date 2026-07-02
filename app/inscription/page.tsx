'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleInscription = async () => {
    if (!email || !password) { setMessage('Remplis tous les champs.'); return }
    if (password.length < 6) { setMessage('Le mot de passe doit faire au moins 6 caractères.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage('Erreur : ' + error.message) }
    else { setDone(true) }
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <div className="w-full max-w-md px-4 text-center">
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <p className="text-5xl mb-4">📬</p>
          <h2 className="text-xl font-bold text-white mb-2">Vérifie ton email !</h2>
          <p className="text-blue-200 text-sm mb-6">Un lien de confirmation a été envoyé à <span className="text-white font-medium">{email}</span>. Clique dessus pour activer ton compte.</p>
          <Link href="/connexion" className="inline-block text-white text-sm font-bold px-6 py-3 rounded-xl" style={{
            background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
            boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
          }}>
            Aller à la connexion →
          </Link>
        </div>
      </div>
    </div>
  )

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
            <p className="text-3xl mb-2">🚀</p>
            <h1 className="text-2xl font-bold text-white">Crée ton compte</h1>
            <p className="text-blue-200 text-sm mt-1">Commence à réviser intelligemment</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
              <input type="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Mot de passe</label>
              <input type="password" placeholder="6 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button
            onClick={handleInscription}
            disabled={loading}
            className="w-full text-white text-sm font-bold py-3 rounded-xl transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            {loading ? 'Création...' : 'Créer mon compte →'}
          </button>

          {message && <p className="mt-4 text-center text-sm text-red-300">{message}</p>}

          <p className="text-center text-sm text-blue-300 mt-6">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="text-white font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Cours() {
  const [chapitre, setChapitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!chapitre || !contenu) { setMessage('Remplis le titre et le contenu.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Tu dois être connecté.'); setLoading(false); return }
    const { error } = await supabase.from('cours').insert({ user_id: user.id, chapitre, contenu })
    if (error) { setMessage('Erreur : ' + error.message) }
    else { setMessage('✅ Cours importé avec succès !'); setChapitre(''); setContenu('') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        input, textarea, select {
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
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
        input:focus, textarea:focus { border-color: rgba(66,165,245,0.8) !important; }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-2xl mx-auto py-10 px-4 relative">
        <div className="card rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <h1 className="text-2xl font-bold text-white mb-2">📚 Importer un cours</h1>
          <p className="text-blue-200 text-sm mb-8">Colle ton cours ci-dessous. L'IA générera automatiquement une fiche de révision.</p>

          <label className="block text-sm font-medium text-blue-200 mb-2">Nom du chapitre</label>
          <input
            type="text"
            placeholder="Ex : Cinétique chimique"
            value={chapitre}
            onChange={(e) => setChapitre(e.target.value)}
            className="mb-5"
          />

          <label className="block text-sm font-medium text-blue-200 mb-2">Contenu du cours</label>
          <textarea
            placeholder="Colle ton cours ici..."
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={12}
            className="mb-6"
            style={{ resize: 'none' }}
          />

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full text-white text-sm font-bold py-3 rounded-xl transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            {loading ? 'Importation...' : 'Importer le cours →'}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-blue-200">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
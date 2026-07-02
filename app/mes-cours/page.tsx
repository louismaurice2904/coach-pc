'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MesCours() {
  const [cours, setCours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCours = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/connexion'; return }
    const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
    if (data) setCours(data)
    setLoading(false)
  }

  const handleSupprimer = async (id: number) => {
    await supabase.from('cours').delete().eq('id', id)
    setCours(cours.filter(c => c.id !== id))
  }

  useEffect(() => { fetchCours() }, [])

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-2xl mx-auto py-10 px-4 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">📚 Mes cours</h1>
            <p className="text-blue-200 text-sm mt-1">{cours.length} chapitre{cours.length > 1 ? 's' : ''} importé{cours.length > 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/cours"
            className="text-white text-sm font-bold px-4 py-2 rounded-xl transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            + Nouveau cours
          </Link>
        </div>

        {loading ? (
          <p className="text-blue-200 text-center">Chargement...</p>
        ) : cours.length === 0 ? (
          <div className="card rounded-2xl p-12 text-center" style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <p className="text-5xl mb-4">📭</p>
            <p className="text-blue-200 mb-6">Tu n'as pas encore importé de cours.</p>
            <Link href="/cours" className="text-white text-sm font-bold px-6 py-3 rounded-xl inline-block" style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}>
              Importer mon premier cours →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cours.map((c) => (
              <div key={c.id} className="card rounded-2xl p-6 flex justify-between items-center" style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <div>
                  <h2 className="font-semibold text-white">{c.chapitre}</h2>
                  <p className="text-xs text-blue-300 mt-1">{c.contenu?.slice(0, 60)}...</p>
                </div>
                <div className="flex gap-3 ml-4">
                  <Link href="/fiche" className="text-xs text-blue-300 hover:text-white transition font-medium">
                    Voir fiche →
                  </Link>
                  <button
                    onClick={() => handleSupprimer(c.id)}
                    className="text-xs text-red-300 hover:text-red-100 transition font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Fiche() {
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (data) setCours(data)
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; }
          .blob { display: none !important; }
          .print-content { color: black !important; }
        }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-2xl mx-auto py-10 px-4 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 no-print">
          <div>
            <h1 className="text-2xl font-bold text-white">📋 Mes fiches de révision</h1>
            <p className="text-blue-200 text-sm mt-1">Clique sur un chapitre pour voir son contenu.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="text-white text-sm font-bold px-4 py-2 rounded-xl transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            🖨️ Imprimer
          </button>
        </div>

        {/* Contenu */}
        {cours.length === 0 ? (
          <div className="card rounded-2xl p-12 text-center" style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <p className="text-5xl mb-4">📭</p>
            <p className="text-blue-200">Aucun cours importé pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-4 print-content">
            {cours.map((c) => (
              <div
                key={c.user_id + c.chapitre}
                className="card rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${selected?.chapitre === c.chapitre ? 'rgba(66,165,245,0.6)' : 'rgba(255,255,255,0.15)'}`,
                }}
                onClick={() => setSelected(selected?.chapitre === c.chapitre ? null : c)}
              >
                <div className="px-6 py-4 flex justify-between items-center no-print">
                  <h2 className="font-semibold text-white">{c.chapitre}</h2>
                  <span className="text-blue-300 text-lg">{selected?.chapitre === c.chapitre ? '▲' : '▼'}</span>
                </div>

                {selected?.chapitre === c.chapitre && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="px-6 py-4 mx-4 my-4 rounded-xl no-print" style={{
                      background: 'rgba(255,193,7,0.1)',
                      border: '1px solid rgba(255,193,7,0.25)'
                    }}>
                      <p className="text-xs font-bold text-yellow-300 mb-2">🤖 Fiche IA</p>
                      <p className="text-xs text-yellow-100">La génération automatique sera disponible prochainement.</p>
                    </div>
                    <div className="px-6 pb-6">
                      <p className="text-xs font-semibold text-blue-300 mb-3 uppercase tracking-wide no-print">Contenu du cours</p>
                      <p className="text-sm text-blue-100 whitespace-pre-wrap leading-relaxed">{c.contenu}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
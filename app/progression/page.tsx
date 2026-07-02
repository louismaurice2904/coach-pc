'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const chapitresProgram = [
  'Cinétique chimique', 'Équilibres acido-basiques', 'Électrochimie',
  'Mécanique', 'Thermodynamique', 'Ondes', 'Optique',
  'Structure de la matière', 'Réactions nucléaires', 'Chimie organique',
  'Spectroscopie', 'Électromagnétisme'
]

export default function Progression() {
  const [cours, setCours] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (data) setCours(data)
    }
    fetch()
  }, [])

  const chapitresImportes = cours.map(c => c.chapitre)
  const progression = Math.round((cours.length / chapitresProgram.length) * 100)

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        @keyframes growBar {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-2xl mx-auto py-10 px-4 relative space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">📈 Ma progression</h1>
          <p className="text-blue-200 text-sm">Visualise tes chapitres maîtrisés avant le bac.</p>
        </div>

        {/* Score global */}
        <div className="card rounded-2xl p-6" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white">Programme couvert</h2>
            <span className="text-2xl font-black text-blue-300">{progression}%</span>
          </div>
          <div className="w-full rounded-full h-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-4 rounded-full transition-all duration-1000" style={{
              width: `${progression}%`,
              background: 'linear-gradient(90deg, #42a5f5, #7c4dff)',
              boxShadow: '0 0 12px #42a5f5'
            }} />
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-blue-200 text-xs">{cours.length} chapitres importés</p>
            <p className="text-blue-200 text-xs">{chapitresProgram.length - cours.length} restants</p>
          </div>
        </div>

        {/* Liste chapitres */}
        <div className="space-y-3">
          {chapitresProgram.map((chap) => {
            const importe = chapitresImportes.includes(chap)
            return (
              <div key={chap} className="card rounded-xl px-5 py-4 flex items-center justify-between" style={{
                background: importe ? 'rgba(46,125,50,0.2)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${importe ? 'rgba(102,187,106,0.4)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{importe ? '✅' : '⭕'}</span>
                  <span className={`text-sm font-medium ${importe ? 'text-green-200' : 'text-blue-200'}`}>{chap}</span>
                </div>
                <div className="w-24 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-2 rounded-full transition-all duration-700" style={{
                    width: importe ? '100%' : '0%',
                    background: 'linear-gradient(90deg, #66bb6a, #2e7d32)',
                    boxShadow: importe ? '0 0 8px #66bb6a' : 'none'
                  }} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
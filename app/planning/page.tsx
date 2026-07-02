'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const chapitres = [
  'Cinétique chimique', 'Équilibres acido-basiques', 'Électrochimie',
  'Mécanique', 'Thermodynamique', 'Ondes', 'Optique',
  'Structure de la matière', 'Réactions nucléaires', 'Chimie organique',
  'Spectroscopie', 'Électromagnétisme'
]

function genererPlanning(tempsSemaine: number, cours: any[]) {
  const heuresParJour = Math.round((tempsSemaine / 5) * 10) / 10
  const chapitresARevoir = cours.length > 0
    ? cours.map(c => c.chapitre)
    : chapitres.slice(0, 3)

  return jours.map((jour, i) => {
    if (i >= 5) return { jour, repos: true, seances: [] }
    const chapitre = chapitresARevoir[i % chapitresARevoir.length]
    const seances = [
      { type: 'Révision cours', duree: Math.round(heuresParJour * 0.4 * 60), chapitre },
      { type: 'Exercices', duree: Math.round(heuresParJour * 0.6 * 60), chapitre },
    ]
    return { jour, repos: false, seances }
  })
}

export default function Planning() {
  const [profil, setProfil] = useState<any>(null)
  const [cours, setCours] = useState<any[]>([])
  const [planning, setPlanning] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (p) setProfil(p)
      if (c) setCours(c)
      const temps = p?.temps_semaine || 5
      setPlanning(genererPlanning(temps, c || []))
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
          * { color: black !important; }
        }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-3xl mx-auto py-10 px-4 relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">📅 Mon planning</h1>
            <p className="text-blue-200 text-sm mt-1">
              {profil ? `Basé sur ${profil.temps_semaine}h de travail par semaine` : 'Chargement...'}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print text-white text-sm font-bold px-4 py-2 rounded-xl transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            🖨️ Imprimer
          </button>
        </div>

        <div className="space-y-4">
          {planning.map((jour) => (
            <div key={jour.jour} className="card rounded-2xl overflow-hidden" style={{
              background: jour.repos ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${jour.repos ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)'}`,
            }}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: jour.repos ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {jour.repos ? '😴' : '📖'}
                  </div>
                  <div>
                    <p className="font-bold text-white">{jour.jour}</p>
                    {jour.repos ? (
                      <p className="text-xs text-blue-300">Repos mérité</p>
                    ) : (
                      <p className="text-xs text-blue-300">{jour.seances.reduce((a: number, s: any) => a + s.duree, 0)} min de travail</p>
                    )}
                  </div>
                </div>
              </div>

              {!jour.repos && (
                <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                  {jour.seances.map((seance: any, i: number) => (
                    <div key={i} style={{
                      background: i === 0 ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
                      borderRadius: 12, padding: '12px 14px'
                    }}>
                      <p className="text-xs font-bold mb-1" style={{ color: i === 0 ? '#60a5fa' : '#a78bfa' }}>
                        {seance.type}
                      </p>
                      <p className="text-sm text-white font-medium">{seance.chapitre}</p>
                      <p className="text-xs text-blue-300 mt-1">⏱ {seance.duree} min</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl p-5" style={{
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid rgba(255,193,7,0.25)'
        }}>
          <p className="text-xs font-bold text-yellow-300 mb-2">💡 Comment est calculé ton planning ?</p>
          <p className="text-xs text-yellow-100 leading-relaxed">
            Ton planning est généré automatiquement selon ton temps de travail hebdomadaire et les chapitres que tu as importés.
            Il s'adaptera automatiquement à mesure que tu progresseras et que tu ajouteras des cours.
          </p>
        </div>
      </div>
    </div>
  )
}
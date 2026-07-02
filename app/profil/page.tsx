'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Profil() {
  const [classe, setClasse] = useState('')
  const [objectif, setObjectif] = useState('')
  const [temps, setTemps] = useState('')
  const [dateBac, setDateBac] = useState('')
  const [prenom, setPrenom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      if (data) {
        setClasse(data.classe || '')
        setObjectif(data.objectif_note?.toString() || '')
        setTemps(data.temps_semaine?.toString() || '')
        setDateBac(data.date_bac || '')
        setPrenom(data.prenom || '')
      }
    }
    fetchProfil()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Tu dois être connecté.'); setLoading(false); return }
    const { error } = await supabase.from('profils').upsert({
      user_id: user.id,
      prenom,
      classe,
      objectif_note: parseInt(objectif),
      temps_semaine: parseInt(temps),
      date_bac: dateBac,
    })
    if (error) { setMessage('Erreur : ' + error.message) }
    else { setMessage('✅ Profil enregistré !') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        input, select {
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
        input:focus, select:focus { border-color: rgba(66,165,245,0.8) !important; }
        select option { background: #1a237e; color: white; }
      `}</style>

      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-xl mx-auto py-10 px-4 relative">
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              🎓
            </div>
            <h1 className="text-2xl font-bold text-white">Mon profil</h1>
            <p className="text-blue-200 text-sm mt-1">Ces informations personnalisent ton expérience</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Prénom</label>
              <input type="text" placeholder="Ton prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Classe</label>
              <select value={classe} onChange={(e) => setClasse(e.target.value)}>
                <option value="">Choisir...</option>
                <option value="Première">Première</option>
                <option value="Terminale">Terminale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Note visée au bac (sur 20)</label>
              <input type="number" min="0" max="20" placeholder="Ex : 16" value={objectif} onChange={(e) => setObjectif(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Temps de travail par semaine (heures)</label>
              <input type="number" min="1" placeholder="Ex : 5" value={temps} onChange={(e) => setTemps(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Date du bac</label>
              <input type="date" value={dateBac} onChange={(e) => setDateBac(e.target.value)} />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full text-white text-sm font-bold py-3 rounded-xl mt-6 transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
            }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer mon profil →'}
          </button>

          {message && <p className="mt-4 text-center text-sm text-green-300">{message}</p>}

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm text-blue-300 hover:text-white transition">
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
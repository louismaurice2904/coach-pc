'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const conseils = [
  "Révise par petites sessions de 25 minutes avec des pauses courtes.",
  "Relis tes erreurs passées avant de commencer un nouveau chapitre.",
  "Explique un concept à voix haute — c'est le meilleur test de compréhension.",
  "La veille d'un contrôle, privilégie la révision légère.",
  "Les formules s'apprennent mieux en les utilisant dans des exercices.",
]

export default function Dashboard() {
  const [profil, setProfil] = useState<any>(null)
  const [cours, setCours] = useState<any[]>([])
  const [joursRestants, setJoursRestants] = useState<number | null>(null)
  const [conseil] = useState(conseils[Math.floor(Math.random() * conseils.length)])
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (p) {
        setProfil(p)
        if (p.date_bac) {
          const diff = Math.ceil((new Date(p.date_bac).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          setJoursRestants(diff)
        }
      }
      if (c) setCours(c)
    }
    fetch()
  }, [])

  const progression = cours.length > 0 ? Math.min(Math.round((cours.length / 12) * 100), 100) : 0

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #90caf9 50%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .fade-in {
          animation: fadeInUp 0.6s ease forwards;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      {/* Blobs décoratifs */}
      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-5 relative">

        {/* Header */}
        <div className="fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold shimmer-text">Bonjour 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {profil ? `${profil.classe} · Objectif ${profil.objectif_note}/20 · ${profil.temps_semaine}h/semaine` : 'Chargement...'}
            </p>
          </div>
          {joursRestants !== null && (
            <div className="card text-center rounded-2xl px-6 py-4 relative overflow-hidden" style={{
              background: joursRestants < 30 ? 'linear-gradient(135deg, #bf360c, #e64a19)' : 'linear-gradient(135deg, #0d47a1, #1565c0)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div className="blob" style={{ width: 100, height: 100, background: '#fff', top: -20, right: -20, opacity: 0.1 }} />
              <p className="text-4xl font-black text-white">{joursRestants}</p>
              <p className="text-xs text-blue-100 mt-1 font-medium">jours avant le bac</p>
            </div>
          )}
        </div>

        {/* Progression */}
        <div className="card fade-in rounded-2xl p-6" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white text-lg">📈 Progression globale</h2>
            <span className="text-2xl font-black text-blue-300">{progression}%</span>
          </div>
          <div className="w-full rounded-full h-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-4 rounded-full transition-all duration-1000" style={{
              width: `${progression}%`,
              background: 'linear-gradient(90deg, #42a5f5, #7c4dff)',
              boxShadow: '0 0 12px #42a5f5'
            }} />
          </div>
          <p className="text-blue-200 text-xs mt-2">{cours.length} chapitre{cours.length > 1 ? 's' : ''} importé{cours.length > 1 ? 's' : ''} sur 12 au programme</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Cours importés', value: cours.length, icon: '📚', gradient: 'linear-gradient(135deg, #1565c0, #0d47a1)', glow: '#42a5f5' },
            { label: 'Fiches générées', value: 0, icon: '📋', gradient: 'linear-gradient(135deg, #2e7d32, #1b5e20)', glow: '#66bb6a' },
            { label: 'Exercices faits', value: 0, icon: '✏️', gradient: 'linear-gradient(135deg, #e65100, #bf360c)', glow: '#ffa726' },
          ].map((stat) => (
            <div key={stat.label} className="card rounded-2xl p-5 relative overflow-hidden" style={{
              background: stat.gradient,
              boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)`
            }}>
              <div className="blob" style={{ width: 80, height: 80, background: '#fff', top: -20, right: -20, opacity: 0.1 }} />
              <div className="text-3xl mb-3">{stat.icon}</div>
              <p className="text-4xl font-black text-white">{stat.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Conseil du jour */}
        <div className="card fade-in rounded-2xl p-5 flex gap-4 items-start" style={{
          background: 'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1))',
          border: '1px solid rgba(255,193,7,0.3)',
          backdropFilter: 'blur(12px)'
        }}>
          <div className="text-3xl" style={{ animation: 'float 3s ease-in-out infinite' }}>💡</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300 mb-1">Conseil du jour</p>
            <p className="text-sm text-yellow-100">{conseil}</p>
          </div>
        </div>

        {/* Derniers cours + Prochaine étape */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card rounded-2xl p-6" style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)'
          }}>
            <h2 className="font-bold text-white mb-4">📚 Derniers cours</h2>
            {cours.length === 0 ? (
              <p className="text-sm text-blue-300">Aucun cours importé.</p>
            ) : (
              <ul className="space-y-2">
                {cours.slice(-3).reverse().map((c) => (
                  <li key={c.id ?? c.chapitre} className="flex items-center gap-2 text-sm text-blue-100 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-blue-400">→</span> {c.chapitre}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/cours" className="inline-block mt-4 text-sm font-semibold text-blue-300 hover:text-white transition">
              + Importer un cours
            </Link>
          </div>

          <div className="card rounded-2xl p-6" style={{
            background: 'linear-gradient(135deg, rgba(21,101,192,0.4), rgba(13,71,161,0.4))',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(66,165,245,0.3)'
          }}>
            <h2 className="font-bold text-white mb-3">🎯 Prochaine étape</h2>
            <p className="text-sm text-blue-200 mb-5">
              {cours.length === 0
                ? "Commence par importer ton premier cours de physique-chimie."
                : "Consulte tes fiches pour renforcer tes connaissances."}
            </p>
            <Link
              href={cours.length === 0 ? '/cours' : '/fiche'}
              className="inline-block text-white text-sm font-bold px-5 py-3 rounded-xl transition hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
                boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
              }}
            >
              {cours.length === 0 ? "Importer un cours →" : "Voir mes fiches →"}
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />

      </div>
    </div>
  )
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "Comment fonctionne la génération de fiches ?", r: "Tu importes ton cours en le collant dans l'application. L'IA analyse le contenu et génère automatiquement une fiche structurée avec les notions clés, formules et résumés. (Disponible prochainement)" },
    { q: "Les exercices sont-ils vraiment adaptés au bac ?", r: "Oui — les exercices sont générés en tenant compte du format officiel du bac de physique-chimie, avec des questions de cours, des applications numériques et des exercices type DS." },
    { q: "Puis-je importer des cours par photo ?", r: "La fonctionnalité d'import par photo est en cours de développement. Pour l'instant, tu peux coller le texte de ton cours directement dans l'application." },
    { q: "Mes données sont-elles sécurisées ?", r: "Oui. Tes cours et résultats sont stockés de façon sécurisée et ne sont accessibles que par toi. Nous utilisons Supabase, une infrastructure de niveau professionnel." },
    { q: "CoachPC est-il gratuit ?", r: "L'accès de base est gratuit et te donne accès à l'import de cours et aux fonctionnalités essentielles. Une version Premium avec l'IA complète sera disponible prochainement." },
  ]

  return (
    <div className="rounded-2xl p-6" style={{
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.12)'
    }}>
      <h2 className="font-bold text-white text-lg mb-5">❓ Questions fréquentes</h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-5 py-4 flex justify-between items-center text-sm font-medium text-white hover:bg-white/5 transition"
            >
              {faq.q}
              <span className="text-blue-300 ml-4 text-lg transition-transform" style={{ transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-blue-200 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="pt-3">{faq.r}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
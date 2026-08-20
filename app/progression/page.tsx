'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PROGRAMME_PAR_NIVEAU: Record<string, string[]> = {
  'Seconde': [
    'Constitution et transformations de la matière',
    'Mouvement et interactions',
    'Ondes et signaux',
    'Énergie, conversions et transferts',
    'Description de la matière à l\'échelle macroscopique',
    'Évolution temporelle d\'un système',
    'Description d\'un fluide au repos',
    'Sécurité et prévention des risques chimiques',
  ],
  'Première': [
    'Ondes et signaux',
    'Transformations chimiques',
    'Mouvement et interactions mécaniques',
    'Énergie : conversion et stockage',
    'Suivi de l\'évolution d\'un système chimique',
    'Quantité de matière et concentration',
    'Structures et propriétés des entités organiques',
    'Mouvement dans un champ',
    'Réactions acido-basiques',
    'Structure microscopique et propriétés macroscopiques',
  ],
  'Terminale': [
    'Cinétique chimique', 'Équilibres acido-basiques', 'Électrochimie',
    'Mécanique', 'Thermodynamique', 'Ondes', 'Optique',
    'Structure de la matière', 'Réactions nucléaires', 'Chimie organique',
    'Spectroscopie', 'Électromagnétisme'
  ],
}

export default function Progression() {
  const [cours, setCours] = useState<any[]>([])
  const [progressions, setProgressions] = useState<Record<string, any>>({})
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }

      const { data: profil } = await supabase.from('profils').select('niveau_scolaire').eq('user_id', user.id).single()
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)

      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)

      const { data: p } = await supabase.from('progression_chapitres').select('*').eq('user_id', user.id)
      if (p) {
        const map: Record<string, any> = {}
        p.forEach((item: any) => { map[item.chapitre] = item })
        setProgressions(map)
      }
    }
    init()
  }, [])

  const chapitresProgram = PROGRAMME_PAR_NIVEAU[niveauScolaire] || PROGRAMME_PAR_NIVEAU['Terminale']
  const chapitresImportes = cours.map(c => c.chapitre)
  const totalScore = Object.values(progressions).reduce((acc: number, p: any) => acc + p.score_moyen, 0)
  const progression = chapitresProgram.length > 0
    ? Math.round(totalScore / (chapitresProgram.length * 100) * 100)
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(34,197,94,0.08)', outline: 'rgba(34,197,94,0.25)', bar: 'linear-gradient(90deg,#22c55e,#16a34a)', text: '#86efac' }
    if (score >= 50) return { bg: 'rgba(245,158,11,0.08)', outline: 'rgba(245,158,11,0.25)', bar: 'linear-gradient(90deg,#f59e0b,#d97706)', text: '#fcd34d' }
    return { bg: 'rgba(239,68,68,0.08)', outline: 'rgba(239,68,68,0.25)', bar: 'linear-gradient(90deg,#ef4444,#dc2626)', text: '#fca5a5' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.3s ease}
        .card-hover:hover{transform:translateY(-2px);background:rgba(255,255,255,0.05)!important}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>📈 Ma progression</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Tes scores réels basés sur tes exercices — programme de {niveauScolaire}.
        </p>

        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: 'Inter, sans-serif' }}>Score global</h2>
            <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: 24, fontFamily: 'Inter, sans-serif' }}>{progression}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 10 }}>
            <div style={{
              width: `${progression}%`, height: 10, borderRadius: 99,
              background: '#38bdf8',
              transition: 'width 1s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              {Object.keys(progressions).length} chapitres travaillés
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              {chapitresProgram.length - Object.keys(progressions).length} restants
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { color: '#86efac', label: '≥ 80% — Maîtrisé' },
            { color: '#fcd34d', label: '50-79% — En progrès' },
            { color: '#fca5a5', label: '< 50% — À revoir' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chapitresProgram.map(chap => {
            const importe = chapitresImportes.includes(chap)
            const prog = progressions[chap]
            const score = prog?.score_moyen || 0
            const couleurs = getScoreColor(score)

            return (
              <div key={chap} className="card-hover" style={{
                borderRadius: 14, padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                background: prog ? couleurs.bg : importe ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                outline: `1px solid ${prog ? couleurs.outline : importe ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {prog && score >= 80 ? '✅' : prog ? '🔄' : importe ? '📚' : '⭕'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: prog ? 'rgba(255,255,255,0.9)' : importe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                      fontSize: 14, fontWeight: prog ? 600 : 400, fontFamily: 'Inter, sans-serif', marginBottom: prog ? 6 : 0
                    }}>
                      {chap}
                    </p>
                    {prog && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 4 }}>
                          <div style={{
                            width: `${score}%`, height: 4, borderRadius: 99,
                            background: couleurs.bar, transition: 'width 0.8s ease'
                          }} />
                        </div>
                        <span style={{ color: couleurs.text, fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                          {score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {prog && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                      {prog.nb_sessions} session{prog.nb_sessions > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {!prog && importe && (
                  <Link href="/exercices" style={{
                    fontSize: 12, color: '#38bdf8', textDecoration: 'none',
                    fontWeight: 600, fontFamily: 'Inter, sans-serif', flexShrink: 0
                  }}>
                    Faire des exercices →
                  </Link>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
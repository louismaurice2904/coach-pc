'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Controles() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [dateControle, setDateControle] = useState('')
  const [programme, setProgramme] = useState('')
  const [plan, setPlan] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mesControles, setMesControles] = useState<any[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('premium').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
      const { data: ctrl } = await supabase.from('controles').select('*').eq('user_id', user.id).order('date_controle', { ascending: true })
      if (ctrl) setMesControles(ctrl)
    }
    init()
  }, [])

  const toggleChapitre = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const genererPlan = async () => {
    if (selected.length === 0 || !dateControle) { toast('Choisis au moins un chapitre et une date', 'error'); return }
    setLoading(true)
    setPlan([])

    const joursRestants = Math.ceil((new Date(dateControle).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (joursRestants < 0) { toast('La date est déjà passée', 'error'); setLoading(false); return }

    const chapitresNoms = cours.filter(c => selected.includes(c.id)).map(c => c.chapitre)

    try {
      const res = await fetch('/api/plan-controle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapitres: chapitresNoms, programme, joursRestants })
      })
      const data = await res.json()
      if (data.error) {
        toast('Erreur lors de la génération', 'error')
      } else {
        setPlan(data.plan)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('controles').insert({
            user_id: user.id, chapitre: chapitresNoms.join(', '), date_controle: dateControle, programme
          })
          const { data: ctrl } = await supabase.from('controles').select('*').eq('user_id', user.id).order('date_controle', { ascending: true })
          if (ctrl) setMesControles(ctrl)
        }
        toast('Plan de révision généré ✅', 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const getTypeIcon = (type: string) => {
    if (type === 'fiche') return '📋'
    if (type === 'exercices-facile') return '🟢'
    return '🔴'
  }

  const getTypeLink = (type: string) => {
    if (type === 'fiche') return '/fiche'
    return '/exercices'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        input,select,textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:12px 16px;width:100%;outline:none;font-size:14px;font-family:Inter,sans-serif}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25)}
        input:focus,select:focus,textarea:focus{border-color:rgba(56,189,248,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            🎯 Préparer un contrôle
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Indique ton prochain DS et les chapitres concernés, Novalys génère ton plan de révision jour par jour.
        </p>

        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            CHAPITRES CONCERNÉS ({selected.length} sélectionné{selected.length > 1 ? 's' : ''})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {cours.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Aucun cours importé.</p>
            ) : cours.map(c => (
              <button key={c.id} onClick={() => toggleChapitre(c.id)} style={{
                padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                background: selected.includes(c.id) ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                color: selected.includes(c.id) ? 'white' : 'rgba(255,255,255,0.6)',
                outline: selected.includes(c.id) ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span>{selected.includes(c.id) ? '☑️' : '⬜'}</span>
                {c.chapitre}
              </button>
            ))}
          </div>

          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>DATE DU CONTRÔLE</label>
          <input type="date" value={dateControle} onChange={e => setDateControle(e.target.value)} style={{ marginBottom: 16 }} />

          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>PROGRAMME (optionnel)</label>
          <textarea placeholder="Ex : tout sauf la partie sur les catalyseurs" value={programme} onChange={e => setProgramme(e.target.value)} rows={2} style={{ resize: 'none', marginBottom: 20 }} />

          <button onClick={() => checkAccess(genererPlan)} disabled={loading || selected.length === 0} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 15, padding: '14px',
            borderRadius: 14, fontFamily: 'Inter, sans-serif', opacity: loading || selected.length === 0 ? 0.5 : 1
          }}>
            {loading ? 'Génération...' : '✨ Générer mon plan de révision'}
          </button>
        </div>

        {plan.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>📅 Ton plan de révision</h2>
            {plan.map((etape, i) => (
              <Link key={i} href={getTypeLink(etape.type)} style={{ textDecoration: 'none' }}>
                <div className="glass" style={{ borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    background: 'rgba(56,189,248,0.1)', borderRadius: 10, padding: '8px 14px',
                    color: '#7dd3fc', fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif', flexShrink: 0
                  }}>
                    {etape.jour}
                  </div>
                  <span style={{ fontSize: 18 }}>{getTypeIcon(etape.type)}</span>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Inter, sans-serif', flex: 1 }}>{etape.tache}</p>
                  <span style={{ color: '#38bdf8', fontSize: 13 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {mesControles.length > 0 && (
          <div>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>📌 Mes contrôles à venir</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mesControles.map(c => {
                const jours = Math.ceil((new Date(c.date_controle).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={c.id} className="glass" style={{ borderRadius: 14, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{c.chapitre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{new Date(c.date_controle).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span style={{
                      color: jours <= 2 ? '#fca5a5' : '#7dd3fc', fontWeight: 700, fontSize: 13,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {jours === 0 ? "Aujourd'hui" : jours < 0 ? 'Passé' : `J-${jours}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'
import { usePremiumCheck } from '../components/PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Evaluation() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [chapitre, setChapitre] = useState('')
  const [apercu, setApercu] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyse, setAnalyse] = useState<any>(null)
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageData, setImageData] = useState<{ base64: string, type: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('niveau_scolaire, premium').eq('user_id', user.id).single()
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
      setIsPremium(profil?.premium || false)
    }
    init()
  }, [])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image trop lourde (max 5MB)', 'error'); return }

    setAnalyse(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64Full = ev.target?.result as string
      setApercu(base64Full)
      setImageData({ base64: base64Full.split(',')[1], type: file.type })
    }
    reader.readAsDataURL(file)
  }

    const lancerAnalyse = async () => {
    if (!imageData) { toast('Ajoute une photo de ta copie', 'error'); return }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/analyser-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          imageBase64: imageData.base64,
          imageType: imageData.type,
          chapitre,
          niveauScolaire
        })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setAnalyse(data)
        if (userId) {
          await supabase.from('evaluations').insert({
            user_id: userId,
            chapitre: chapitre || 'Non spécifié',
            analyse: JSON.stringify(data),
            date_evaluation: new Date().toISOString().split('T')[0]
          })
        }
        toast('Analyse terminée ✅', 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <PremiumModal />
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        select{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:12px 16px;width:100%;outline:none;font-size:14px;font-family:Inter,sans-serif}
        select option{background:#0c1120;color:white}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            🔍 Analyser ma copie
          </h1>
          {!isPremium && (
            <span style={{ background: 'rgba(56,189,248,0.12)', outline: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              👑 PREMIUM
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
          Prends en photo ta copie corrigée avec l'appréciation du prof, l'IA t'aide à progresser.
        </p>

        <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
            CHAPITRE CONCERNÉ (optionnel)
          </label>
          <select value={chapitre} onChange={e => setChapitre(e.target.value)} style={{ marginBottom: 20 }}>
            <option value="">Non spécifié</option>
            {cours.map(c => <option key={c.id} value={c.chapitre}>{c.chapitre}</option>)}
          </select>

          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
            PHOTO DE TA COPIE CORRIGÉE
          </label>
          <div onClick={() => fileRef.current?.click()} style={{
            border: '2px dashed rgba(56,189,248,0.4)', borderRadius: 16, padding: '30px 20px',
            textAlign: 'center', cursor: 'pointer', background: 'rgba(56,189,248,0.05)', marginBottom: 20
          }}>
            {apercu ? (
              <div>
                <img src={apercu} alt="aperçu" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Clique pour changer la photo</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📸</p>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Prends une photo de ta copie corrigée</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Assure-toi que l'appréciation et les annotations sont bien visibles</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />

          <button onClick={() => checkAccess(lancerAnalyse)} disabled={loading || !imageData} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 15, padding: '14px',
            borderRadius: 14, fontFamily: 'Inter, sans-serif', opacity: loading || !imageData ? 0.5 : 1
          }}>
            {loading ? '🤖 Analyse en cours...' : '🔍 Analyser ma copie'}
          </button>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.2)', borderTop: '2px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
                Claude lit ta copie et l'appréciation...
              </p>
            </div>
          )}
        </div>

        {analyse && (
          <div className="glass" style={{ borderRadius: 20, padding: 28, animation: 'fadeIn 0.5s ease' }}>
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>📋 RÉSUMÉ</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{analyse.resume}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#fca5a5', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>⚠️ ERREURS RÉCURRENTES</p>
              {analyse.erreurs_recurrentes?.map((e: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#fca5a5' }}>•</span>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{e}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>✅ POINTS FORTS</p>
              {analyse.points_forts?.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#86efac' }}>•</span>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{p}</p>
                </div>
              ))}
            </div>

            <div style={{
              borderRadius: 14, padding: 18,
              background: 'rgba(250,204,21,0.06)', outline: '1px solid rgba(250,204,21,0.2)'
            }}>
              <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>💡 PISTES D'AMÉLIORATION</p>
              {analyse.pistes_amelioration?.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#fcd34d', fontWeight: 700 }}>{i + 1}.</span>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
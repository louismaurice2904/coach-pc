'use client'

import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Cours() {
  const { toast } = useToast()
  const [chapitre, setChapitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingFichier, setLoadingFichier] = useState(false)
  const [mode, setMode] = useState<'texte' | 'photo' | 'pdf'>('texte')
  const [apercu, setApercu] = useState<string | null>(null)
  const [nomFichierPdf, setNomFichierPdf] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const handleImport = async () => {
    if (!chapitre || !contenu) { toast('Remplis le titre et le contenu.', 'error'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast('Tu dois être connecté.', 'error'); setLoading(false); return }
    const { data: profil } = await supabase.from('profils').select('niveau_scolaire').eq('user_id', user.id).single()
    const { error } = await supabase.from('cours').insert({ user_id: user.id, chapitre, contenu, niveau_scolaire: profil?.niveau_scolaire || 'Terminale' })
    if (error) { toast('Erreur : ' + error.message, 'error') }
    else {
      toast('Cours importé avec succès ✅', 'success')
      setChapitre('')
      setContenu('')
      setApercu(null)
      setNomFichierPdf('')
    }
    setLoading(false)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image trop lourde (max 5MB)', 'error'); return }

    setLoadingFichier(true)
    setContenu('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64Full = ev.target?.result as string
      setApercu(base64Full)
      const base64Data = base64Full.split(',')[1]
      const imageType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

      try {
        const res = await fetch('/api/lire-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, imageType })
        })
        const data = await res.json()
        if (data.error) { toast('Erreur lors de la lecture de la photo', 'error') }
        else { setContenu(data.texte); toast('Photo lue avec succès ✅', 'success') }
      } catch { toast('Erreur de connexion', 'error') }
      setLoadingFichier(false)
    }
    reader.readAsDataURL(file)
  }

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast('PDF trop lourd (max 10MB)', 'error'); return }
    if (file.type !== 'application/pdf') { toast('Le fichier doit être un PDF', 'error'); return }

    setLoadingFichier(true)
    setContenu('')
    setNomFichierPdf(file.name)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64Full = ev.target?.result as string
      const base64Data = base64Full.split(',')[1]

      try {
        const res = await fetch('/api/lire-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64Data })
        })
        const data = await res.json()
        if (data.error) { toast('Erreur lors de la lecture du PDF', 'error') }
        else { setContenu(data.texte); toast('PDF lu avec succès ✅', 'success') }
      } catch { toast('Erreur de connexion', 'error') }
      setLoadingFichier(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        textarea,input[type="text"]{background:rgba(255,255,255,0.08)!important;border:1px solid rgba(255,255,255,0.2)!important;color:white!important;border-radius:12px;padding:12px 16px;width:100%;outline:none;font-size:14px;transition:border 0.2s;font-family:Inter,sans-serif}
        textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.4)}
        textarea:focus,input:focus{border-color:rgba(56,189,248,0.8)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
            📚 Importer un cours
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
            Colle ton cours, prends une photo, ou importe un PDF — l'IA génère automatiquement une fiche.
          </p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
            {(['texte', 'photo', 'pdf'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setApercu(null); setContenu(''); setNomFichierPdf('') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#070b18' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s'
                }}
              >
                {m === 'texte' ? '⌨️ Texte' : m === 'photo' ? '📷 Photo' : '📄 PDF'}
              </button>
            ))}
          </div>

          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
            NOM DU CHAPITRE
          </label>
          <input type="text" placeholder="Ex : Cinétique chimique" value={chapitre} onChange={e => setChapitre(e.target.value)} style={{ marginBottom: 20 }} />

          {mode === 'texte' && (
            <>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                CONTENU DU COURS
              </label>
              <textarea placeholder="Colle ton cours ici..." value={contenu} onChange={e => setContenu(e.target.value)} rows={12} style={{ resize: 'none', marginBottom: 8 }} />
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>{contenu.length} caractères</p>
            </>
          )}

          {mode === 'photo' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>PHOTO DU COURS</label>
              <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed rgba(56,189,248,0.4)', borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(56,189,248,0.05)', marginBottom: 16 }}>
                {loadingFichier ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#7dd3fc', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>Claude lit ta photo...</p>
                  </div>
                ) : apercu ? (
                  <div>
                    <img src={apercu} alt="aperçu" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Clique pour changer la photo</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>📷</p>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Clique pour prendre ou uploader une photo</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>JPG, PNG, WEBP — max 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
              {contenu && (
                <>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>TEXTE EXTRAIT — VÉRIFIE ET CORRIGE SI BESOIN</label>
                  <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={10} style={{ resize: 'vertical' }} />
                </>
              )}
            </div>
          )}

          {mode === 'pdf' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>FICHIER PDF</label>
              <div onClick={() => pdfRef.current?.click()} style={{ border: '2px dashed rgba(56,189,248,0.4)', borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(56,189,248,0.05)', marginBottom: 16 }}>
                {loadingFichier ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#7dd3fc', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>Claude lit ton PDF...</p>
                  </div>
                ) : nomFichierPdf ? (
                  <div>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>📄</p>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>{nomFichierPdf}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6, fontFamily: 'Inter, sans-serif' }}>Clique pour changer de fichier</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>📄</p>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Clique pour uploader un PDF</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Max 10MB</p>
                  </div>
                )}
              </div>
              <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePdf} style={{ display: 'none' }} />
              {contenu && (
                <>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>TEXTE EXTRAIT — VÉRIFIE ET CORRIGE SI BESOIN</label>
                  <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={10} style={{ resize: 'vertical' }} />
                </>
              )}
            </div>
          )}

          <button onClick={handleImport} disabled={loading || loadingFichier || !chapitre || !contenu} className="btn-primary" style={{
            width: '100%', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14, fontFamily: 'Inter, sans-serif',
            opacity: loading || loadingFichier || !chapitre || !contenu ? 0.5 : 1
          }}>
            {loading ? 'Importation...' : 'Importer le cours →'}
          </button>

        </div>
      </div>
    </div>
  )
}
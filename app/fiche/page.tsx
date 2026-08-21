'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '../components/Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Fiche() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [fiche, setFiche] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fiches, setFiches] = useState<Record<string, string>>({})
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const [explicationAlternative, setExplicationAlternative] = useState('')
  const [loadingExplication, setLoadingExplication] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [longueur, setLongueur] = useState<'courte' | 'normale' | 'detaillee'>('normale')
  const [niveauFormules, setNiveauFormules] = useState<'peu' | 'normal' | 'beaucoup'>('normal')
  const [demandeLibre, setDemandeLibre] = useState('')
  const [showPersonnalisation, setShowPersonnalisation] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/connexion'; return }
      setUserId(user.id)
      const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (data) setCours(data)

      const { data: profil } = await supabase.from('profils').select('niveau_scolaire, pref_longueur_fiche, pref_niveau_formules').eq('user_id', user.id).single()
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
      if (profil?.pref_longueur_fiche) setLongueur(profil.pref_longueur_fiche)
      if (profil?.pref_niveau_formules) setNiveauFormules(profil.pref_niveau_formules)

      const { data: fichesData } = await supabase.from('fiches_generees').select('*').eq('user_id', user.id)
      if (fichesData) {
        const map: Record<string, string> = {}
        fichesData.forEach((f: any) => { map[f.chapitre] = f.contenu_fiche })
        setFiches(map)
      }
    }
    init()
  }, [])

  const genererFicheAvecParams = async (c: any) => {
    setFiche('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/generer-fiche', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ chapitre: c.chapitre, contenu: c.contenu, niveauScolaire, longueur, niveauFormules, demandeLibre })
      })
      const data = await res.json()
      if (data.error) {
        toast(data.error, 'error')
      } else {
        setFiche(data.fiche)
        setFiches(prev => ({ ...prev, [c.chapitre]: data.fiche }))

        if (userId) {
          await supabase.from('fiches_generees').delete().eq('user_id', userId).eq('chapitre', c.chapitre)
          await supabase.from('fiches_generees').insert({
            user_id: userId,
            chapitre: c.chapitre,
            contenu_fiche: data.fiche
          })
        }

        toast('Fiche générée ✅', 'success')
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoading(false)
  }

  const selectionnerChapitre = (c: any) => {
    setSelected(c)
    setExplicationAlternative('')
    if (fiches[c.chapitre]) {
      setFiche(fiches[c.chapitre])
    } else {
      setFiche('')
    }
  }

  const expliquerAutrement = async () => {
    if (!selected || !fiche) return
    setLoadingExplication(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/expliquer-autrement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ notion: selected.chapitre, explicationPrecedente: fiche.slice(0, 500), niveauScolaire })
      })
      const data = await res.json()
      if (data.error) {
        toast('Erreur', 'error')
      } else {
        setExplicationAlternative(data.explication)
      }
    } catch {
      toast('Erreur de connexion', 'error')
    }
    setLoadingExplication(false)
  }

  const formaterFiche = (texte: string) => {
    return texte.split('\n').map((ligne, i) => {
      const cleanLigne = ligne.replace(/^#+\s*/, '').replace(/\*\*/g, '')
      if (ligne.startsWith('##') || ligne.match(/^[1-5]\./)) {
        return (
          <div key={i} className="fiche-titre" style={{ color: '#7dd3fc', fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8, letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
            {cleanLigne}
          </div>
        )
      }
      if (ligne.startsWith('**') && ligne.endsWith('**')) {
        return (
          <div key={i} className="fiche-soustitre" style={{ color: 'white', fontWeight: 700, fontSize: 13, marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
            {cleanLigne}
          </div>
        )
      }
      if (ligne.startsWith('- ') || ligne.startsWith('• ')) {
        return (
          <div key={i} className="fiche-puce" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>▸</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
              {cleanLigne.replace(/^[-•]\s*/, '')}
            </span>
          </div>
        )
      }
      if (ligne.trim() === '') return <div key={i} style={{ height: 6 }} />
      return (
        <div key={i} className="fiche-texte" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          {cleanLigne}
        </div>
      )
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.3s ease;cursor:pointer}
        .card-hover:hover{background:rgba(255,255,255,0.05)!important;border-color:rgba(56,189,248,0.4)!important}
        .btn-primary{background:#fff;color:#070b18;transition:opacity 0.2s ease;border:none;cursor:pointer}
        .btn-primary:hover{opacity:0.85}
        textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:12px;padding:12px 14px;width:100%;outline:none;font-size:13px;font-family:Inter,sans-serif;resize:vertical}
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(56,189,248,0.6)!important}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media print{
          nav,.no-print{display:none!important}
          body{background:white!important;color:black!important;margin:0!important;padding:0!important}
          .print-content{color:black!important;width:100%!important;max-width:100%!important}
          .glass{background:white!important;border:none!important;backdrop-filter:none!important;box-shadow:none!important;padding:0!important;width:100%!important;max-width:100%!important}
          .noise{display:none!important}
          div[style*="position: fixed"]{display:none!important}
          .fiche-grid{display:block!important}
        }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }} className="no-print">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>📋 Mes fiches</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Sélectionne un chapitre, personnalise-la à ta façon.
            </p>
          </div>
          {selected && fiche && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => window.print()} className="btn-primary no-print" style={{
                fontWeight: 700, fontSize: 13, padding: '12px 20px', borderRadius: 12, fontFamily: 'Inter, sans-serif'
              }}>
                🖨️ Imprimer
              </button>
            </div>
          )}
        </div>

        <div className="fiche-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: 20 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="no-print">
            {cours.length === 0 ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                  Aucun cours importé.
                </p>
              </div>
            ) : cours.map(c => (
              <div
                key={c.id}
                className="glass card-hover"
                onClick={() => selectionnerChapitre(c)}
                style={{
                  borderRadius: 16, padding: '14px 18px',
                  border: selected?.id === c.id ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: selected?.id === c.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{
                    color: selected?.id === c.id ? 'white' : 'rgba(255,255,255,0.7)',
                    fontWeight: selected?.id === c.id ? 700 : 400,
                    fontSize: 14, fontFamily: 'Inter, sans-serif'
                  }}>
                    {c.chapitre}
                  </p>
                  {fiches[c.chapitre] && (
                    <span style={{ fontSize: 10, color: '#86efac', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>✓</span>
                  )}
                </div>
              </div>
            ))}

            {selected && (
              <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 8 }}>
                <button onClick={() => setShowPersonnalisation(!showPersonnalisation)} style={{
                  background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: showPersonnalisation ? 14 : 0,
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%'
                }}>
                  {showPersonnalisation ? '▾' : '▸'} Personnaliser la fiche
                </button>

                {showPersonnalisation && (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>LONGUEUR</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {[
                        { id: 'courte', label: 'Courte et synthétique' },
                        { id: 'normale', label: 'Normale' },
                        { id: 'detaillee', label: 'Détaillée' },
                      ].map(l => (
                        <button key={l.id} onClick={() => setLongueur(l.id as any)} style={{
                          padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif',
                          background: longueur === l.id ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                          color: longueur === l.id ? '#7dd3fc' : 'rgba(255,255,255,0.5)',
                        }}>
                          {l.label}
                        </button>
                      ))}
                    </div>

                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>FORMULES</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {[
                        { id: 'peu', label: 'Peu de formules' },
                        { id: 'normal', label: 'Normal' },
                        { id: 'beaucoup', label: 'Beaucoup, avec exemples' },
                      ].map(f => (
                        <button key={f.id} onClick={() => setNiveauFormules(f.id as any)} style={{
                          padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif',
                          background: niveauFormules === f.id ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                          color: niveauFormules === f.id ? '#7dd3fc' : 'rgba(255,255,255,0.5)',
                        }}>
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>DEMANDE PRÉCISE</label>
                    <textarea
                      rows={3}
                      placeholder="Ex : beaucoup d'exemples concrets, insiste sur la méthode..."
                      value={demandeLibre}
                      onChange={e => setDemandeLibre(e.target.value)}
                      style={{ marginBottom: 14 }}
                    />
                  </div>
                )}

                <button onClick={() => genererFicheAvecParams(selected)} disabled={loading} className="btn-primary" style={{
                  width: '100%', fontWeight: 700, fontSize: 13, padding: '12px', borderRadius: 10, fontFamily: 'Inter, sans-serif',
                  opacity: loading ? 0.6 : 1
                }}>
                  {loading ? 'Génération...' : fiches[selected.chapitre] ? '🔄 Régénérer' : '✨ Générer'}
                </button>
              </div>
            )}
          </div>

          {selected && (
            <div className="glass" style={{ borderRadius: 20, padding: 28, minHeight: 400 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                      🤖 Claude génère ta fiche...
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', animation: 'pulse 2s ease-in-out infinite' }}>
                      Ça prend 10-15 secondes
                    </p>
                  </div>
                </div>
              ) : fiche ? (
                <div className="print-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <p style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>FICHE DE RÉVISION • GÉNÉRÉE PAR IA</p>
                      <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, fontFamily: 'Inter, sans-serif' }}>{selected.chapitre}</h2>
                    </div>
                  </div>
                  <div>{formaterFiche(fiche)}</div>

                  <div className="no-print" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {!explicationAlternative ? (
                      <button onClick={expliquerAutrement} disabled={loadingExplication} style={{
                        background: 'rgba(250,204,21,0.1)', outline: '1px solid rgba(250,204,21,0.3)',
                        border: 'none', color: '#fcd34d', fontWeight: 700, fontSize: 13,
                        padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        opacity: loadingExplication ? 0.6 : 1
                      }}>
                        {loadingExplication ? '🤖 Réflexion...' : "🔄 Je n'ai pas compris, explique-moi autrement"}
                      </button>
                    ) : (
                      <div style={{
                        borderRadius: 14, padding: 18, animation: 'fadeIn 0.4s ease',
                        background: 'rgba(250,204,21,0.06)', outline: '1px solid rgba(250,204,21,0.2)'
                      }}>
                        <p style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>💡 UNE AUTRE FAÇON DE VOIR</p>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{explicationAlternative}</p>
                        <button onClick={expliquerAutrement} style={{
                          marginTop: 12, background: 'none', border: 'none', color: '#38bdf8',
                          fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600
                        }}>
                          Encore une autre explication →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, textAlign: 'center' }}>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>👈</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                    Personnalise et génère ta fiche à gauche.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
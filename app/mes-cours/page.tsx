'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useToast } from '../components/Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MesCours() {
  const { toast } = useToast()
  const [cours, setCours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notesOpen, setNotesOpen] = useState<number | null>(null)
  const [noteContent, setNoteContent] = useState<Record<number, string>>({})
  const [savingNote, setSavingNote] = useState(false)

  const fetchCours = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/connexion'; return }
    const { data } = await supabase.from('cours').select('*').eq('user_id', user.id)
    if (data) {
      setCours(data)
      const notes: Record<number, string> = {}
      data.forEach((c: any) => { if (c.notes) notes[c.id] = c.notes })
      setNoteContent(notes)
    }
    setLoading(false)
  }

  const handleSupprimer = async (id: number) => {
    if (!confirm('Supprimer ce cours ?')) return
    await supabase.from('cours').delete().eq('id', id)
    setCours(cours.filter(c => c.id !== id))
    toast('Cours supprimé', 'info')
  }

  const handleSaveNote = async (id: number) => {
    setSavingNote(true)
    const { error } = await supabase.from('cours').update({ notes: noteContent[id] || '' }).eq('id', id)
    if (!error) toast('Note enregistrée ✅', 'success')
    else toast('Erreur lors de la sauvegarde', 'error')
    setSavingNote(false)
  }

  useEffect(() => { fetchCours() }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060d2e' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.3s ease}
        .card-hover:hover{background:rgba(255,255,255,0.07)!important;border-color:rgba(99,102,241,0.4)!important}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 30px rgba(99,102,241,0.4);transition:all 0.3s}
        .glow-btn:hover{box-shadow:0 0 50px rgba(99,102,241,0.7);transform:scale(1.05)}
        textarea{
          background:rgba(255,255,255,0.05)!important;
          border:1px solid rgba(255,255,255,0.1)!important;
          color:white!important;border-radius:12px;padding:12px 14px;
          width:100%;outline:none;font-size:13px;font-family:Inter,sans-serif;resize:vertical;
        }
        textarea::placeholder{color:rgba(255,255,255,0.25)}
        textarea:focus{border-color:rgba(99,102,241,0.6)!important}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>📚 Mes cours</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              {cours.length} chapitre{cours.length > 1 ? 's' : ''} importé{cours.length > 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/cours" className="glow-btn" style={{
            color: 'white', fontWeight: 700, fontSize: 13,
            padding: '12px 20px', borderRadius: 12, textDecoration: 'none',
            fontFamily: 'Inter, sans-serif'
          }}>
            + Nouveau cours
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass" style={{ borderRadius: 20, height: 80, opacity: 0.4 }} />
            ))}
          </div>
        ) : cours.length === 0 ? (
          <div className="glass" style={{ borderRadius: 24, padding: 60, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
              Tu n'as pas encore importé de cours.
            </p>
            <Link href="/cours" className="glow-btn" style={{
              color: 'white', fontWeight: 700, fontSize: 13,
              padding: '12px 24px', borderRadius: 12, textDecoration: 'none', display: 'inline-block'
            }}>
              Importer mon premier cours →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cours.map(c => (
              <div key={c.id} className="glass card-hover" style={{ borderRadius: 20, overflow: 'hidden' }}>
                {/* En-tête de la carte */}
                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                      {c.chapitre}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                      {c.contenu?.slice(0, 60)}...
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginLeft: 16, flexShrink: 0, alignItems: 'center' }}>
                    {/* Bouton Notes */}
                    <button
                      onClick={() => setNotesOpen(notesOpen === c.id ? null : c.id)}
                      style={{
                        color: notesOpen === c.id ? '#fcd34d' : 'rgba(255,255,255,0.4)',
                        fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
                        cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
                        transition: 'color 0.2s', fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      📝 Notes {noteContent[c.id] ? '●' : ''}
                    </button>
                    <Link href="/fiche" style={{ color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                      Voir →
                    </Link>
                    <button
                      onClick={() => handleSupprimer(c.id)}
                      style={{
                        color: 'rgba(239,68,68,0.7)', fontSize: 13, fontWeight: 600,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => (e.target as HTMLElement).style.color = '#ef4444'}
                      onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(239,68,68,0.7)'}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Panel Notes — s'ouvre quand on clique sur Notes */}
                {notesOpen === c.id && (
                  <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{
                      color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.08em', marginBottom: 10, paddingTop: 16,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      MES NOTES PERSONNELLES
                    </p>
                    <textarea
                      rows={4}
                      placeholder="Ajoute tes propres notes, remarques, points à retenir sur ce chapitre..."
                      value={noteContent[c.id] || ''}
                      onChange={e => setNoteContent(prev => ({ ...prev, [c.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveNote(c.id)}
                      disabled={savingNote}
                      style={{
                        marginTop: 10, padding: '10px 20px', borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: 'white', fontWeight: 700, fontSize: 13,
                        fontFamily: 'Inter, sans-serif', opacity: savingNote ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {savingNote ? 'Sauvegarde...' : 'Sauvegarder la note →'}
                    </button>
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
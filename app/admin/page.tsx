'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = 'louismaurice2904@gmail.com' // ← remplace par ton email

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [newQ, setNewQ] = useState('')
  const [newR, setNewR] = useState('')
  const [onglet, setOnglet] = useState<'messages' | 'faq'>('messages')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        window.location.href = '/dashboard'
        return
      }
      setAuthorized(true)
      const { data: m } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
      const { data: f } = await supabase.from('faq').select('*').order('ordre', { ascending: true })
      if (m) setMessages(m)
      if (f) setFaqs(f)
      setLoading(false)
    }
    init()
  }, [])

  const marquerLu = async (id: number) => {
    await supabase.from('messages').update({ lu: true }).eq('id', id)
    setMessages(messages.map(m => m.id === id ? { ...m, lu: true } : m))
  }

  const supprimerMessage = async (id: number) => {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(messages.filter(m => m.id !== id))
  }

  const ajouterFaq = async () => {
    if (!newQ || !newR) return
    const { data } = await supabase.from('faq').insert({ question: newQ, reponse: newR, ordre: faqs.length + 1 }).select().single()
    if (data) { setFaqs([...faqs, data]); setNewQ(''); setNewR('') }
  }

  const supprimerFaq = async (id: number) => {
    await supabase.from('faq').delete().eq('id', id)
    setFaqs(faqs.filter(f => f.id !== id))
  }

  if (!authorized || loading) return (
    <div style={{ minHeight: '100vh', background: '#060d2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#060d2e' }}>
      <style>{`
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 20px rgba(99,102,241,0.4); transition: all 0.3s; border: none; cursor: pointer; }
        .glow-btn:hover { box-shadow: 0 0 40px rgba(99,102,241,0.7); transform: scale(1.03); }
        input, textarea {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; border-radius: 10px; padding: 10px 14px;
          width: 100%; outline: none; font-size: 13px; font-family: inherit;
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { border-color: rgba(99,102,241,0.6) !important; }
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>⚙️ Panel Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Gère les messages et la FAQ de CoachPC.</p>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['messages', 'faq'] as const).map(tab => (
            <button key={tab} onClick={() => setOnglet(tab)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: onglet === tab ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: onglet === tab ? 'white' : 'rgba(255,255,255,0.4)',
              boxShadow: onglet === tab ? '0 0 20px rgba(99,102,241,0.4)' : 'none'
            }}>
              {tab === 'messages' ? `💬 Messages (${messages.filter(m => !m.lu).length} non lus)` : '❓ FAQ'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {onglet === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aucun message pour l'instant.</p>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className="glass" style={{
                borderRadius: 18, padding: 24,
                borderLeft: `3px solid ${m.lu ? 'rgba(255,255,255,0.1)' : '#818cf8'}`,
                opacity: m.lu ? 0.6 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.nom}</p>
                    <p style={{ color: '#818cf8', fontSize: 12 }}>{m.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!m.lu && (
                      <button onClick={() => marquerLu(m.id)} style={{
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                        color: '#86efac', fontSize: 12, fontWeight: 600, padding: '6px 12px',
                        borderRadius: 8, cursor: 'pointer'
                      }}>✓ Lu</button>
                    )}
                    <button onClick={() => supprimerMessage(m.id)} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#fca5a5', fontSize: 12, fontWeight: 600, padding: '6px 12px',
                      borderRadius: 8, cursor: 'pointer'
                    }}>Supprimer</button>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7 }}>{m.contenu}</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {onglet === 'faq' && (
          <div>
            {/* Ajouter une FAQ */}
            <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>➕ Ajouter une question</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="Question..." value={newQ} onChange={e => setNewQ(e.target.value)} />
                <textarea placeholder="Réponse..." value={newR} onChange={e => setNewR(e.target.value)} rows={3} style={{ resize: 'none' }} />
                <button onClick={ajouterFaq} className="glow-btn" style={{
                  color: 'white', fontWeight: 700, fontSize: 13, padding: '12px', borderRadius: 10
                }}>
                  Ajouter →
                </button>
              </div>
            </div>

            {/* Liste FAQ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.length === 0 ? (
                <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aucune FAQ pour l'instant.</p>
                </div>
              ) : faqs.map(f => (
                <div key={f.id} className="glass" style={{ borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.question}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>{f.reponse}</p>
                  </div>
                  <button onClick={() => supprimerFaq(f.id)} style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5', fontSize: 12, fontWeight: 600, padding: '6px 12px',
                    borderRadius: 8, cursor: 'pointer', flexShrink: 0
                  }}>Supprimer</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
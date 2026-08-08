'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { usePremiumCheck } from './PremiumGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ChatFlottant() {
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState(false)
  const [cours, setCours] = useState<any[]>([])
  const [chapitreActif, setChapitreActif] = useState<any>(null)
  const [messages, setMessages] = useState<{ role: string; contenu: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const { checkAccess, PremiumModal } = usePremiumCheck(isPremium)
  const [userId, setUserId] = useState<string | null>(null)
  const [niveauScolaire, setNiveauScolaire] = useState('Terminale')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAuthPage = pathname === '/' || pathname === '/connexion' || pathname === '/inscription'

  useEffect(() => {
    if (isAuthPage) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: c } = await supabase.from('cours').select('*').eq('user_id', user.id)
      if (c) setCours(c)
      const { data: profil } = await supabase.from('profils').select('premium, niveau_scolaire').eq('user_id', user.id).single()
      setIsPremium(profil?.premium || false)
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
    }
    init()
  }, [isAuthPage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const choisirChapitre = (c: any) => {
    setChapitreActif(c)
    setMessages([{ role: 'assistant', contenu: `Salut ! Je suis là pour t'aider sur "${c.chapitre}". Pose-moi n'importe quelle question sur ce chapitre.` }])
  }

  const envoyerMessage = async () => {
    if (!input.trim() || !chapitreActif) return
    const question = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', contenu: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat-cours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapitre: chapitreActif.chapitre,
          contenu: chapitreActif.contenu,
          historique: messages,
          question,
          niveauScolaire,
          userId
        })
      })
      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', contenu: `⚠️ ${data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', contenu: data.reponse }])
        if (userId) {
          await supabase.from('messages_chat').insert([
            { user_id: userId, chapitre: chapitreActif.chapitre, role: 'user', contenu: question, horodatage: new Date().toISOString() },
            { user_id: userId, chapitre: chapitreActif.chapitre, role: 'assistant', contenu: data.reponse, horodatage: new Date().toISOString() }
          ])
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', contenu: '⚠️ Erreur de connexion' }])
    }
    setLoading(false)
  }

  const reinitialiser = () => {
    setChapitreActif(null)
    setMessages([])
  }

  if (isAuthPage || !userId) return null

  return (
    <>
      <PremiumModal />
      <style>{`
        @keyframes chatSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes chatPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.4); } 50% { box-shadow: 0 0 0 8px rgba(56,189,248,0); } }
        .chat-bubble-btn { animation: chatPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* Bouton flottant */}
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className="chat-bubble-btn"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 998,
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'white', color: '#070b18', fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          💬
        </button>
      )}

      {/* Fenêtre de chat */}
      {ouvert && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 360, height: 520, borderRadius: 20, overflow: 'hidden',
          background: '#0c1120', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          animation: 'chatSlideUp 0.25s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', background: '#10182c', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                {chapitreActif ? chapitreActif.chapitre : 'Assistant Novalys'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {chapitreActif && (
                <button onClick={reinitialiser} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>↺</button>
              )}
              <button onClick={() => setOuvert(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Contenu */}
          {!chapitreActif ? (
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
                SUR QUEL CHAPITRE AS-TU UNE QUESTION ?
              </p>
              {cours.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Importe d'abord un cours pour utiliser le chat.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cours.map(c => (
                    <button key={c.id} onClick={() => checkAccess(() => choisirChapitre(c))} style={{
                      padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                      background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)'
                    }}>
                      {c.chapitre}
                    </button>
                  ))}
                </div>
              )}
              {!isPremium && (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 16, fontFamily: 'Inter, sans-serif' }}>
                  👑 Fonctionnalité Premium
                </p>
              )}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.role === 'user' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                    color: m.role === 'user' ? '#070b18' : 'rgba(255,255,255,0.8)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {m.contenu}
                  </div>
                ))}
                {loading && (
                  <div style={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                    Novalys écrit...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && envoyerMessage()}
                  placeholder="Pose ta question..."
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                <button onClick={envoyerMessage} disabled={loading || !input.trim()} style={{
                  background: 'white', color: '#070b18', border: 'none', borderRadius: 10,
                  padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  opacity: loading || !input.trim() ? 0.5 : 1
                }}>
                  →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
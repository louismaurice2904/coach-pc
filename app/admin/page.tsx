'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = 'louismaurice2904@gmail.com' // ← vérifie que c'est bien ton email

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [conseils, setConseils] = useState<any[]>([])
  const [usage, setUsage] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [newQ, setNewQ] = useState('')
  const [newR, setNewR] = useState('')
  const [newConseil, setNewConseil] = useState('')
  const [onglet, setOnglet] = useState<'apercu' | 'messages' | 'faq' | 'conseils' | 'usage'>('apercu')
  const [loading, setLoading] = useState(true)
  const [loadingUsage, setLoadingUsage] = useState(false)

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
      const { data: c } = await supabase.from('conseils').select('*').order('id', { ascending: false })
      if (m) setMessages(m)
      if (f) setFaqs(f)
      if (c) setConseils(c)
      setLoading(false)
      chargerStats()
    }
    init()
  }, [])

  const chargerStats = async () => {
    setLoadingStats(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin-stats', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (!data.error) setStats(data)
    } catch (e) {
      console.error('Erreur chargement stats:', e)
    }
    setLoadingStats(false)
  }

  const chargerUsage = async () => {
    setLoadingUsage(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin-usage', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (data.classement) setUsage(data.classement)
    } catch (e) {
      console.error('Erreur chargement usage:', e)
    }
    setLoadingUsage(false)
  }

  const toggleSuspension = async (targetUserId: string, suspenduActuel: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/admin-suspendre', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ targetUserId, suspendre: !suspenduActuel })
    })
    setUsage(usage.map(u => u.user_id === targetUserId ? { ...u, suspendu: !suspenduActuel } : u))
  }

  useEffect(() => {
    if (onglet === 'usage' && usage.length === 0) {
      chargerUsage()
    }
  }, [onglet])

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

  const ajouterConseil = async () => {
    if (!newConseil) return
    const { data } = await supabase.from('conseils').insert({ texte: newConseil, actif: true }).select().single()
    if (data) { setConseils([data, ...conseils]); setNewConseil('') }
  }

  const toggleConseilActif = async (id: number, actif: boolean) => {
    await supabase.from('conseils').update({ actif: !actif }).eq('id', id)
    setConseils(conseils.map(c => c.id === id ? { ...c, actif: !actif } : c))
  }

  const supprimerConseil = async (id: number) => {
    await supabase.from('conseils').delete().eq('id', id)
    setConseils(conseils.filter(c => c.id !== id))
  }

  if (!authorized || loading) return (
    <div style={{ minHeight: '100vh', background: '#070b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .glow-btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 20px rgba(99,102,241,0.4);transition:all 0.3s;border:none;cursor:pointer}
        .glow-btn:hover{box-shadow:0 0 40px rgba(99,102,241,0.7);transform:scale(1.03)}
        input,textarea{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;color:white!important;border-radius:10px;padding:10px 14px;width:100%;outline:none;font-size:13px;font-family:inherit}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25)}
        input:focus,textarea:focus{border-color:rgba(99,102,241,0.6)!important}
      `}</style>

      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>⚙️ Novalys Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Pilote ton produit, ton contenu et tes utilisateurs.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['apercu', 'messages', 'faq', 'conseils', 'usage'] as const).map(tab => (
            <button key={tab} onClick={() => setOnglet(tab)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: onglet === tab ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: onglet === tab ? 'white' : 'rgba(255,255,255,0.4)',
              boxShadow: onglet === tab ? '0 0 20px rgba(99,102,241,0.4)' : 'none'
            }}>
              {tab === 'apercu' ? '📊 Vue d\'ensemble' : tab === 'messages' ? `💬 Messages (${messages.filter(m => !m.lu).length})` : tab === 'faq' ? '❓ FAQ' : tab === 'conseils' ? '💡 Conseils du jour' : '🔍 Usage IA'}
            </button>
          ))}
        </div>

        {onglet === 'apercu' && (
          <div>
            {loadingStats || !stats ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Chargement des statistiques...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Inscrits', valeur: stats.totalInscrits, couleur: '#38bdf8' },
                    { label: 'Abonnés payants', valeur: stats.abonnesPaye, couleur: '#86efac' },
                    { label: 'Essais actifs', valeur: stats.essaisActifs, couleur: '#fcd34d' },
                    { label: 'Revenu mensuel est.', valeur: `${stats.revenuMensuelEstime.toFixed(2)}€`, couleur: '#c4b5fd' },
                  ].map(s => (
                    <div key={s.label} className="glass" style={{ borderRadius: 16, padding: 18 }}>
                      <p style={{ color: s.couleur, fontWeight: 900, fontSize: 26, marginBottom: 4 }}>{s.valeur}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>ACTIVITÉ IA</p>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                      <div>
                        <p style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{stats.appelsIA7j}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>appels / 7 jours</p>
                      </div>
                      <div>
                        <p style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{stats.appelsIA30j}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>appels / 30 jours</p>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TOP FONCTIONNALITÉS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stats.topRoutes.map((r: any) => (
                        <div key={r.route} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.route}</span>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>RÉPARTITION PAR NIVEAU</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(stats.repartitionNiveau).map(([niveau, count]: any) => (
                        <div key={niveau}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{niveau}</span>
                            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{count}</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6 }}>
                            <div style={{ width: `${(count / Math.max(stats.totalInscrits, 1)) * 100}%`, height: 6, borderRadius: 99, background: '#38bdf8' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Cours importés au total</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{stats.totalCours}</span>
                    </div>
                  </div>
                </div>

                {(stats.comptesSuspendus > 0 || stats.messagesNonLus > 0) && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {stats.messagesNonLus > 0 && (
                      <button onClick={() => setOnglet('messages')} style={{
                        background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 12,
                        padding: '12px 18px', cursor: 'pointer', color: '#7dd3fc', fontSize: 13, fontWeight: 600
                      }}>
                        📬 {stats.messagesNonLus} message{stats.messagesNonLus > 1 ? 's' : ''} non lu{stats.messagesNonLus > 1 ? 's' : ''}
                      </button>
                    )}
                    {stats.comptesSuspendus > 0 && (
                      <button onClick={() => setOnglet('usage')} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12,
                        padding: '12px 18px', cursor: 'pointer', color: '#fca5a5', fontSize: 13, fontWeight: 600
                      }}>
                        🚫 {stats.comptesSuspendus} compte{stats.comptesSuspendus > 1 ? 's' : ''} suspendu{stats.comptesSuspendus > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}

                <button onClick={chargerStats} style={{
                  marginTop: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, padding: '8px 14px',
                  borderRadius: 8, cursor: 'pointer'
                }}>
                  🔄 Actualiser les statistiques
                </button>
              </>
            )}
          </div>
        )}

        {onglet === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aucun message.</p>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className="glass" style={{ borderRadius: 18, padding: 24, borderLeft: `3px solid ${m.lu ? 'rgba(255,255,255,0.1)' : '#38bdf8'}`, opacity: m.lu ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.nom}</p>
                    <p style={{ color: '#38bdf8', fontSize: 12 }}>{m.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!m.lu && <button onClick={() => marquerLu(m.id)} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>✓ Lu</button>}
                    <button onClick={() => supprimerMessage(m.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Supprimer</button>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7 }}>{m.contenu}</p>
              </div>
            ))}
          </div>
        )}

        {onglet === 'faq' && (
          <div>
            <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>➕ Ajouter une question</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="Question..." value={newQ} onChange={e => setNewQ(e.target.value)} />
                <textarea placeholder="Réponse..." value={newR} onChange={e => setNewR(e.target.value)} rows={3} style={{ resize: 'none' }} />
                <button onClick={ajouterFaq} className="glow-btn" style={{ color: 'white', fontWeight: 700, fontSize: 13, padding: '12px', borderRadius: 10 }}>Ajouter →</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.map(f => (
                <div key={f.id} className="glass" style={{ borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.question}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>{f.reponse}</p>
                  </div>
                  <button onClick={() => supprimerFaq(f.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}>Supprimer</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'conseils' && (
          <div>
            <div className="glass" style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>➕ Ajouter un conseil du jour</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea placeholder="Écris ton conseil ici..." value={newConseil} onChange={e => setNewConseil(e.target.value)} rows={3} style={{ resize: 'none' }} />
                <button onClick={ajouterConseil} className="glow-btn" style={{ color: 'white', fontWeight: 700, fontSize: 13, padding: '12px', borderRadius: 10 }}>Ajouter →</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conseils.length === 0 ? (
                <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aucun conseil pour l'instant.</p>
                </div>
              ) : conseils.map(c => (
                <div key={c.id} className="glass" style={{ borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, opacity: c.actif ? 1 : 0.4 }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{c.texte}</p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleConseilActif(c.id, c.actif)} style={{
                      background: c.actif ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${c.actif ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: c.actif ? '#86efac' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600,
                      padding: '6px 12px', borderRadius: 8, cursor: 'pointer'
                    }}>
                      {c.actif ? '✓ Actif' : 'Inactif'}
                    </button>
                    <button onClick={() => supprimerConseil(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'usage' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Classement des 30 derniers jours, par nombre d'appels IA.</p>
              <button onClick={chargerUsage} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, padding: '8px 14px',
                borderRadius: 8, cursor: 'pointer'
              }}>
                🔄 Actualiser
              </button>
            </div>

            {loadingUsage ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Chargement...</p>
              </div>
            ) : usage.length === 0 ? (
              <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aucun usage enregistré sur les 30 derniers jours.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {usage.map((u, i) => (
                  <div key={u.user_id} className="glass" style={{
                    borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16, opacity: u.suspendu ? 0.5 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, width: 24 }}>#{i + 1}</span>
                      <div>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{u.prenom}</p>
                        {u.suspendu && <span style={{ color: '#fca5a5', fontSize: 11, fontWeight: 700 }}>SUSPENDU</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 16 }}>{u.nb_appels} appels</span>
                      <button onClick={() => toggleSuspension(u.user_id, u.suspendu)} style={{
                        background: u.suspendu ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${u.suspendu ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: u.suspendu ? '#86efac' : '#fca5a5', fontSize: 12, fontWeight: 600,
                        padding: '8px 14px', borderRadius: 8, cursor: 'pointer'
                      }}>
                        {u.suspendu ? 'Réactiver' : 'Suspendre'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'

export function Confetti({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [particles, setParticles] = useState<any[]>([])

  useEffect(() => {
    if (!active) return
    const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']
    const p = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 10,
      round: Math.random() > 0.5,
    }))
    setParticles(p)
    const t = setTimeout(() => { setParticles([]); onDone?.() }, 3500)
    return () => clearTimeout(t)
  }, [active])

  if (!particles.length) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: 0,
          width: p.size, height: p.size,
          borderRadius: p.round ? '50%' : 2,
          background: p.color,
          animation: `fall ${p.duration}s ease-in ${p.delay}s forwards`
        }} />
      ))}
    </div>
  )
}
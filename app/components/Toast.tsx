'use client'
import { useState, createContext, useContext, useCallback } from 'react'

type TType = 'success' | 'error' | 'info' | 'badge'
type Toast = { id: number; message: string; type: TType }
type Ctx = { toast: (message: string, type?: TType) => void }

const ToastContext = createContext<Ctx>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: TType = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const bg: Record<TType, string> = {
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    badge: 'linear-gradient(135deg, #f59e0b, #d97706)',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(120px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
            color: 'white', background: bg[t.type],
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.3s ease', maxWidth: 340,
            fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            {t.type === 'badge' ? '🏆' : t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
'use client'

import { useState, useRef } from 'react'

interface VoiceInputProps {
  onResult: (texte: string) => void
  disabled?: boolean
}

export function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const [enregistrement, setEnregistrement] = useState(false)
  const [supporte, setSupporte] = useState(true)
  const recognitionRef = useRef<any>(null)

  const demarrer = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupporte(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    let texteFinal = ''

    recognition.onresult = (event: any) => {
      let texteTemporaire = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          texteFinal += event.results[i][0].transcript + ' '
        } else {
          texteTemporaire += event.results[i][0].transcript
        }
      }
      onResult(texteFinal + texteTemporaire)
    }

    recognition.onerror = () => {
      setEnregistrement(false)
    }

    recognition.onend = () => {
      setEnregistrement(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setEnregistrement(true)
  }

  const arreter = () => {
    recognitionRef.current?.stop()
    setEnregistrement(false)
  }

  if (!supporte) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
        🎤 Dictée vocale non disponible sur ce navigateur (essaie avec Chrome)
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={enregistrement ? arreter : demarrer}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
        background: enregistrement ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.12)',
        color: enregistrement ? '#fca5a5' : '#7dd3fc',
        outline: `1px solid ${enregistrement ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.4)'}`,
        opacity: disabled ? 0.5 : 1,
        animation: enregistrement ? 'pulseVoice 1.2s ease-in-out infinite' : 'none'
      }}
    >
      <style>{`
        @keyframes pulseVoice { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
      {enregistrement ? '⏹️ Arrêter' : '🎤 Dicter ma réponse'}
    </button>
  )
}
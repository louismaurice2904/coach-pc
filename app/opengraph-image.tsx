import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Novalys — Ton coach IA pour la physique-chimie'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070b18',
          backgroundImage: 'radial-gradient(circle at 25% 20%, rgba(56,189,248,0.18), transparent 55%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: '#38bdf8',
              display: 'flex',
            }}
          />
          <span
            style={{
              color: '#7dd3fc',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            Physique-Chimie · Seconde à Terminale
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 66,
              fontWeight: 900,
              letterSpacing: -2,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            Arrête de te demander
          </div>
          <div
            style={{
              display: 'flex',
              color: '#38bdf8',
              fontSize: 66,
              fontWeight: 900,
              letterSpacing: -2,
              textAlign: 'center',
              lineHeight: 1.1,
              marginTop: 4,
            }}
          >
            quoi réviser.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 26,
            marginTop: 40,
            textAlign: 'center',
            maxWidth: 780,
          }}
        >
          Fiches, exercices et suivi générés par IA
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 56,
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            Nova
          </span>
          <span
            style={{
              color: '#38bdf8',
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            lys
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
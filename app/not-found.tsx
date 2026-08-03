import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#060d2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .noise { position: fixed; top:-50%; left:-50%; width:200%; height:200%; opacity:0.03; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glow-btn { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 0 30px rgba(99,102,241,0.4); transition: all 0.3s; }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.7); transform: scale(1.05); }
      `}</style>
      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: 24 }}>
        <div style={{ fontSize: 80, animation: 'float 3s ease-in-out infinite', marginBottom: 16 }}>🔭</div>
        <h1 style={{ fontSize: 96, fontWeight: 900, color: 'white', letterSpacing: '-4px', lineHeight: 1, marginBottom: 16 }}>404</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18, marginBottom: 40, maxWidth: 400 }}>
          Cette page n'existe pas... comme certaines formules inventées au bac.
        </p>
        <Link href="/" className="glow-btn" style={{
          display: 'inline-block', color: 'white', fontWeight: 700, fontSize: 15,
          padding: '14px 32px', borderRadius: 14, textDecoration: 'none'
        }}>
          Retour à l'accueil →
        </Link>
      </div>
    </div>
  )
}
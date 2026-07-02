import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    }}>
      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; pointer-events: none; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
      `}</style>
      <div className="blob" style={{ width: 400, height: 400, background: '#42a5f5', top: -100, right: -100 }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#7c4dff', bottom: 100, left: -50 }} />

      <div className="text-center relative px-4">
        <div style={{ animation: 'float 3s ease-in-out infinite', fontSize: 80 }}>🔭</div>
        <h1 className="text-8xl font-black text-white mt-4">404</h1>
        <p className="text-xl text-blue-200 mt-4 mb-8">Cette page n'existe pas... comme certaines formules inventées au bac.</p>
        <Link
          href="/"
          className="inline-block text-white font-bold px-8 py-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
            boxShadow: '0 4px 15px rgba(66,165,245,0.4)'
          }}
        >
          Retour à l'accueil →
        </Link>
      </div>
    </div>
  )
}
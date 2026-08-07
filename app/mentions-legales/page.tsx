import Link from 'next/link'

export default function MentionsLegales() {
  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        h2{color:white;font-size:16px;font-weight:700;margin:28px 0 10px;font-family:Inter,sans-serif}
        p,li{color:rgba(255,255,255,0.55);font-size:14px;line-height:1.8;font-family:Inter,sans-serif}
        ul{padding-left:20px;margin-top:8px}
        a{color:#38bdf8}
      `}</style>
      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Mentions légales & CGU</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>Dernière mise à jour : juillet 2026</p>

          <h2>1. Éditeur du site</h2>
          <p>Novalys est édité à titre personnel par Louis Maurice. Pour tout contact : <a href="mailto:contact@Novalys.fr">contact@Novalys.fr</a></p>

          <h2>2. Hébergement</h2>
          <p>Le site est hébergé par <strong style={{ color: 'white' }}>Vercel Inc.</strong> (440 N Barranca Ave, Covina, CA 91723, USA) et la base de données par <strong style={{ color: 'white' }}>Supabase Inc.</strong> (infrastructure chiffrée, région Europe).</p>

          <h2>3. Données personnelles (RGPD)</h2>
          <p>Novalys collecte les données suivantes :</p>
          <ul>
            <li>Adresse email (authentification)</li>
            <li>Prénom, classe, objectif de note (profil élève)</li>
            <li>Contenu des cours importés</li>
            <li>Données de progression, streaks et badges</li>
          </ul>
          <p style={{ marginTop: 12 }}>Ces données sont utilisées uniquement pour le fonctionnement du service. Elles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.</p>

          <h2>4. Durée de conservation</h2>
          <p>Les données sont conservées pendant toute la durée d'utilisation du compte. En cas de suppression, toutes les données associées sont effacées sous 30 jours.</p>

          <h2>5. Droits des utilisateurs</h2>
          <p>Conformément au RGPD, vous disposez des droits d'accès, rectification, suppression, portabilité et opposition. Pour exercer ces droits : <a href="mailto:contact@Novalys.fr">contact@Novalys.fr</a></p>

          <h2>6. Cookies</h2>
          <p>Novalys utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking n'est utilisé.</p>

          <h2>7. Conditions générales d'utilisation</h2>
          <p>En utilisant Novalys, l'utilisateur s'engage à :</p>
          <ul>
            <li>Ne pas importer de contenus illicites ou contraires aux bonnes mœurs</li>
            <li>Ne pas tenter de contourner les systèmes de sécurité de la plateforme</li>
            <li>Utiliser le service uniquement à des fins personnelles et éducatives</li>
          </ul>
          <p style={{ marginTop: 12 }}>Novalys se réserve le droit de suspendre tout compte en cas de non-respect de ces conditions.</p>

          <h2>8. Propriété intellectuelle</h2>
          <p>L'ensemble du contenu de Novalys (textes, design, code, logo) est protégé par le droit d'auteur. Toute reproduction sans autorisation est interdite.</p>

          <h2>9. Limitation de responsabilité</h2>
          <p>Novalys est un outil d'aide à la révision. Les contenus générés par l'IA sont fournis à titre indicatif et ne sauraient se substituer à l'enseignement d'un professeur qualifié. Novalys ne saurait être tenu responsable des résultats scolaires de l'élève.</p>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'

export default function CGV() {
  return (
    <div style={{ minHeight: '100vh', background: '#070b18' }}>
      <style>{`
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        h2{color:white;font-size:16px;font-weight:700;margin:28px 0 10px;font-family:Inter,sans-serif}
        p,li{color:rgba(255,255,255,0.55);font-size:14px;line-height:1.8;font-family:Inter,sans-serif}
        ul{padding-left:20px;margin-top:8px}
        a{color:#38bdf8}
      `}</style>
      <div className="noise" />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 24, padding: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Conditions générales de vente</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>Dernière mise à jour : août 2026</p>

          <h2>1. Objet</h2>
          <p>Les présentes conditions générales de vente (CGV) régissent la souscription à l'abonnement Novalys Premium, service payant proposé en complément de la version gratuite de Novalys.</p>

          <h2>2. Description de l'offre Premium</h2>
          <p>L'abonnement Novalys Premium donne accès aux fonctionnalités suivantes, en complément de la version gratuite :</p>
          <ul>
            <li>Exercices adaptatifs illimités générés par IA</li>
            <li>Import de cours par photo et PDF (reconnaissance automatique)</li>
            <li>Correction IA détaillée des réponses ouvertes</li>
            <li>Génération de plans de révision avant contrôle</li>
            <li>Génération de sujets type Bac Blanc / Contrôle Blanc</li>
            <li>Analyse de copies corrigées par le professeur</li>
            <li>Mémoire des erreurs avec retry personnalisé</li>
          </ul>

          <h2>3. Prix</h2>
          <p>L'abonnement Premium est facturé 9€ TTC par mois. Le prix peut être amené à évoluer ; toute modification sera communiquée aux abonnés au moins 30 jours avant son application, et n'affectera pas la période déjà payée.</p>

          <h2>4. Modalités de paiement</h2>
          <p>Le paiement s'effectue par carte bancaire via la plateforme sécurisée Stripe. Novalys ne stocke à aucun moment les données de carte bancaire, celles-ci étant traitées exclusivement par Stripe conformément aux normes de sécurité PCI-DSS.</p>

          <h2>5. Durée et renouvellement</h2>
          <p>L'abonnement est mensuel et se renouvelle automatiquement par tacite reconduction, sauf résiliation avant la date de renouvellement. Aucun engagement de durée minimale n'est requis.</p>

          <h2>6. Résiliation</h2>
          <p>L'utilisateur peut résilier son abonnement à tout moment depuis son profil, sans justification ni frais. La résiliation prend effet à la fin de la période déjà payée : l'accès Premium reste actif jusqu'à cette date, sans reconduction du mois suivant.</p>

          <h2>7. Droit de rétractation</h2>
          <p>Conformément à l'article L221-18 du Code de la consommation, l'utilisateur dispose d'un délai de 14 jours à compter de la souscription pour exercer son droit de rétractation, sauf si l'exécution du service a débuté avec son accord exprès avant la fin de ce délai — auquel cas le droit de rétractation ne s'applique plus une fois le service pleinement exécuté.</p>
          <p>Pour exercer ce droit, l'utilisateur peut nous contacter à l'adresse indiquée dans les mentions légales.</p>

          <h2>8. Mineurs et consentement parental</h2>
          <p>Novalys s'adresse en partie à un public mineur (élèves de 15 à 18 ans). Conformément à la réglementation applicable, la souscription à un abonnement payant par un mineur de moins de 15 ans nécessite le consentement et la validation d'un représentant légal, notamment pour le paiement par carte bancaire.</p>
          <p>Les représentants légaux d'un mineur peuvent à tout moment demander la résiliation d'un abonnement souscrit par leur enfant en nous contactant directement.</p>

          <h2>9. Absence de garantie de résultat</h2>
          <p>Novalys est un outil d'aide à la révision. L'abonnement Premium ne constitue en aucun cas une garantie de résultat scolaire ou d'obtention du baccalauréat. Les contenus générés par IA sont fournis à titre indicatif et pédagogique.</p>

          <h2>10. Litiges</h2>
          <p>En cas de litige, l'utilisateur peut nous contacter directement afin de trouver une solution amiable. À défaut d'accord, les litiges relèvent des tribunaux français compétents.</p>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
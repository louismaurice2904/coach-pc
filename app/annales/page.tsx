'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Ressource = { label: string; url: string }

const ANNALES_TERMINALE: Record<string, Ressource[]> = {
  "Cinétique chimique": [{ label: "Cinétique", url: "https://www.labolycee.org/cinetique" }],
  "Équilibres acido-basiques": [{ label: "Acide-Base", url: "https://www.labolycee.org/acide-base" }],
  "Électrochimie": [
    { label: "Piles — Constante d'équilibre", url: "https://www.labolycee.org/piles-constante-equilibre" },
    { label: "Électrolyse", url: "https://www.labolycee.org/electrolyse-0" },
  ],
  "Ondes et particules": [
    { label: "Diffraction", url: "https://www.labolycee.org/diffraction-0" },
    { label: "Interférences", url: "https://www.labolycee.org/interferences-0" },
    { label: "Effet Doppler", url: "https://www.labolycee.org/effet-doppler-0" },
    { label: "Effet photoélectrique", url: "https://www.labolycee.org/effet-photoelectrique" },
  ],
  "Champs et forces": [
    { label: "2e loi de Newton", url: "https://www.labolycee.org/2nde-loi-newton" },
    { label: "Satellites, lois de Kepler", url: "https://www.labolycee.org/satellites-lois-de-kepler-0" },
  ],
  "Chimie organique": [{ label: "Synthèse organique", url: "https://www.labolycee.org/synthese-organique" }],
  "Avancement et modélisation d'un système": [{ label: "Cinétique", url: "https://www.labolycee.org/cinetique" }],
  "Titrages et dosages": [
    { label: "Titrage conductimétrique", url: "https://www.labolycee.org/titrage-conductimetrique" },
    { label: "Titrage pH-métrique", url: "https://www.labolycee.org/titrage-ph-metrique" },
    { label: "Beer-Lambert", url: "https://www.labolycee.org/beer-lambert" },
    { label: "Kohlrausch", url: "https://www.labolycee.org/kohlrausch" },
  ],
  "Mouvement dans un champ uniforme": [
    { label: "Champ de pesanteur uniforme", url: "https://www.labolycee.org/mouvement-dans-un-champ-de-pesanteur-uniforme-0" },
    { label: "Champ électrique uniforme", url: "https://www.labolycee.org/mouvement-dans-un-champ-electrique-uniforme-0" },
  ],
  "Temps, mouvement et évolution": [{ label: "2e loi de Newton", url: "https://www.labolycee.org/2nde-loi-newton" }],
  "Structure et transformation de la matière": [
    { label: "Spectroscopie", url: "https://www.labolycee.org/spectroscopie" },
    { label: "Nucléaire", url: "https://www.labolycee.org/nucleaire" },
  ],
  "Conversion et transfert d'énergie": [
    { label: "Thermodynamique", url: "https://www.labolycee.org/thermodynamique" },
    { label: "Circuits RC", url: "https://www.labolycee.org/circuits-rc-0" },
    { label: "Fluide", url: "https://www.labolycee.org/fluide" },
  ],
}

const ANNALES_PREMIERE: Record<string, Ressource[]> = {
  "Ondes et signaux": [
    { label: "Ondes mécaniques", url: "https://www.labolycee.org/ondes-mecaniques" },
    { label: "Images et couleurs", url: "https://www.labolycee.org/images-et-couleurs" },
  ],
  "Transformations chimiques": [
    { label: "Combustions", url: "https://www.labolycee.org/combustions" },
    { label: "Oxydoréduction", url: "https://www.labolycee.org/oxydoreduction" },
  ],
  "Mouvement et interactions mécaniques": [
    { label: "Vecteur variation de vitesse", url: "https://www.labolycee.org/vecteur-variation-de-vitesse" },
    { label: "Interactions fondamentales", url: "https://www.labolycee.org/interactions-fondamentales" },
  ],
  "Énergie : conversion et stockage": [
    { label: "Théorème de l'énergie cinétique", url: "https://www.labolycee.org/theoreme-de-lenergie-cinetique" },
    { label: "Énergie mécanique", url: "https://www.labolycee.org/energie-mecanique" },
  ],
  "Suivi de l'évolution d'un système chimique": [{ label: "Titrage", url: "https://www.labolycee.org/titrage-0" }],
  "Quantité de matière et concentration": [
    { label: "Quantité de matière", url: "https://www.labolycee.org/quantite-de-matiere" },
    { label: "Solubilité", url: "https://www.labolycee.org/solubilite" },
  ],
  "Structures et propriétés des entités organiques": [
    { label: "Polarité", url: "https://www.labolycee.org/polarite" },
    { label: "Spectroscopie IR", url: "https://www.labolycee.org/spectroscopie-ir" },
  ],
  "Mouvement dans un champ": [
    { label: "Interactions fondamentales", url: "https://www.labolycee.org/interactions-fondamentales" },
  ],
  "Réactions acido-basiques": [{ label: "Titrage", url: "https://www.labolycee.org/titrage-0" }],
  "Structure microscopique et propriétés macroscopiques": [
    { label: "Photon", url: "https://www.labolycee.org/photon" },
  ],
}

export default function Annales() {
  const [chapitreImportes, setChapitreImportes] = useState<string[]>([])
  const [niveauScolaire, setNiveauScolaire] = useState("Terminale")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/connexion"; return }
      const { data: c } = await supabase.from("cours").select("chapitre").eq("user_id", user.id)
      if (c) setChapitreImportes(c.map((x: any) => x.chapitre))
      const { data: profil } = await supabase.from("profils").select("niveau_scolaire").eq("user_id", user.id).single()
      if (profil?.niveau_scolaire) setNiveauScolaire(profil.niveau_scolaire)
    }
    init()
  }, [])

  const source = niveauScolaire === "Première" ? ANNALES_PREMIERE : ANNALES_TERMINALE
  const chapitresAvecRessources = Object.keys(source)

  return (
    <div style={{ minHeight: "100vh", background: "#070b18" }}>
      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; }
        .noise{position:fixed;top:-50%;left:-50%;width:200%;height:200%;opacity:0.03;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
        .glass{background:rgba(255,255,255,0.025);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
        .card-hover{transition:all 0.2s ease}
        .card-hover:hover{border-color:rgba(56,189,248,0.3)!important;background:rgba(56,189,248,0.04)!important}
      `}</style>

      <div className="noise" />
      <div style={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px", position: "relative", zIndex: 1 }}>

        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: "white", letterSpacing: "-0.5px", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
          📚 Annales officielles du bac
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 24, fontFamily: "Inter, sans-serif" }}>
          De vrais sujets du bac, classés par thème, en complément des exercices générés par IA. Ces ressources proviennent de{" "}
          <a href="https://www.labolycee.org" target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>Labolycee.org</a>, une association de professeurs qui publie gratuitement les vraies annales corrigées du bac.
        </p>

        {niveauScolaire === "Seconde" && (
          <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7 }}>
              La Seconde ne comporte pas d'épreuve de bac en physique-chimie — les vraies annales concernent la Première et surtout la Terminale. Tu peux quand même consulter les annales de Première pour t'entraîner en avance.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {chapitresAvecRessources.map(chap => {
            const importe = chapitreImportes.includes(chap)
            return (
              <div key={chap} className="glass" style={{ borderRadius: 16, padding: isMobile ? 16 : 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 14, fontFamily: "Inter, sans-serif" }}>{chap}</p>
                  {importe && (
                    <span style={{ fontSize: 9, color: "#86efac", fontWeight: 700, background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 100 }}>
                      IMPORTÉ
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {source[chap].map(res => (
                    <a
                      key={res.url}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-hover"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)", textDecoration: "none",
                        color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 500
                      }}
                    >
                      {res.label} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a href="https://www.labolycee.org/menu-geographique-0" target="_blank" rel="noopener noreferrer" style={{
            color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none", fontFamily: "Inter, sans-serif"
          }}>
            Voir toutes les annales par session et centre d'examen →
          </a>
        </div>
      </div>
    </div>
  )
}
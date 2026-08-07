import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cours, progressions, tempsDisponible, joursAvantBac } = await req.json()

    if (!cours || cours.length === 0) {
      return NextResponse.json({
        recommandation: null,
        message: "Importe ton premier cours pour recevoir ton programme du jour."
      })
    }

    // Logique : prioriser les chapitres avec le score le plus bas ou jamais travaillés
    const chapitresAvecScore = cours.map((c: any) => {
      const prog = progressions?.[c.chapitre]
      return {
        chapitre: c.chapitre,
        score: prog?.score_moyen ?? -1, // -1 = jamais travaillé, priorité max
        nbSessions: prog?.nb_sessions ?? 0
      }
    })

    // Trier : jamais travaillé en premier, puis score le plus bas
    chapitresAvecScore.sort((a: any, b: any) => a.score - b.score)
    const prioritaire = chapitresAvecScore[0]

    // Déterminer le type d'activité recommandée
    let typeActivite: 'fiche' | 'exercices' = 'exercices'
    let raison = ''

    if (prioritaire.score === -1) {
      typeActivite = 'fiche'
      raison = `Tu n'as pas encore travaillé ce chapitre. Commence par la fiche pour poser les bases.`
    } else if (prioritaire.score < 50) {
      typeActivite = 'exercices'
      raison = `Ton score sur ce chapitre est de ${prioritaire.score}%. Il est temps de le retravailler.`
    } else if (prioritaire.score < 80) {
      typeActivite = 'exercices'
      raison = `Tu es à ${prioritaire.score}% sur ce chapitre. Encore un effort pour le maîtriser complètement.`
    } else {
      typeActivite = 'exercices'
      raison = `Ce chapitre est bien maîtrisé (${prioritaire.score}%). Une petite session d'entretien pour ne pas oublier.`
    }

    // Urgence si le bac approche
    let urgence = ''
    if (joursAvantBac && joursAvantBac < 30) {
      urgence = `Le bac approche (${joursAvantBac} jours) — concentre-toi sur tes points faibles en priorité.`
    }

    return NextResponse.json({
      recommandation: {
        chapitre: prioritaire.chapitre,
        type: typeActivite,
        raison,
        urgence,
        dureeEstimee: Math.min(tempsDisponible || 30, 45)
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { chapitres, programme, joursRestants } = await req.json()

    if (!chapitres || chapitres.length === 0 || !joursRestants) {
      return NextResponse.json({ error: 'Chapitres et jours restants requis' }, { status: 400 })
    }

    const jours = Math.max(1, Math.min(joursRestants, 14))
    const nbChapitres = chapitres.length
    const plan: { jour: string; type: string; tache: string }[] = []

    // Répartition : chaque chapitre a besoin d'un passage "fiche" + un passage "exercices"
    // On alterne les chapitres sur les jours disponibles pour ne pas tout empiler sur un seul jour
    const etapesParChapitre = chapitres.flatMap((chap: string) => [
      { type: 'fiche', chapitre: chap },
      { type: 'exercices-facile', chapitre: chap },
      { type: 'exercices-difficile', chapitre: chap },
    ])

    // Si peu de jours par rapport au nombre d'étapes, on regroupe plusieurs étapes par jour
    const etapesParJour = Math.max(1, Math.ceil(etapesParChapitre.length / jours))

    let etapeIndex = 0
    for (let j = 0; j < jours && etapeIndex < etapesParChapitre.length; j++) {
      const label = j === 0 ? "Aujourd'hui" : j === jours - 1 ? 'Veille du DS' : `J-${jours - j}`
      const etapesDuJour = etapesParChapitre.slice(etapeIndex, etapeIndex + etapesParJour)
      etapeIndex += etapesParJour

      etapesDuJour.forEach((etape: any) => {
        let tache = ''
        let type = etape.type
        if (etape.type === 'fiche') tache = `Relire la fiche : ${etape.chapitre}`
        else if (etape.type === 'exercices-facile') tache = `Exercices faciles : ${etape.chapitre}`
        else tache = `Exercices difficiles : ${etape.chapitre}`

        plan.push({ jour: label, type, tache })
      })
    }

    // Dernier jour : toujours une révision globale si plusieurs chapitres
    if (nbChapitres > 1) {
      plan.push({ jour: 'Veille du DS', type: 'fiche', tache: `Relecture rapide de tous les chapitres : ${chapitres.join(', ')}` })
    }

    return NextResponse.json({ plan })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
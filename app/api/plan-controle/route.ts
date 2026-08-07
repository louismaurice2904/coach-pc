import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { chapitre, programme, joursRestants } = await req.json()

    if (!chapitre || !joursRestants) {
      return NextResponse.json({ error: 'Chapitre et date requis' }, { status: 400 })
    }

    const plan = []
    const jours = Math.max(1, Math.min(joursRestants, 10))

    if (jours >= 6) {
      plan.push({ jour: `J-${jours}`, tache: 'Relire le cours en entier', type: 'fiche' })
      plan.push({ jour: `J-${jours - 1}`, tache: 'Générer et étudier la fiche de révision', type: 'fiche' })
      plan.push({ jour: `J-${Math.round(jours * 0.6)}`, tache: 'Exercices niveau facile', type: 'exercices-facile' })
      plan.push({ jour: `J-${Math.round(jours * 0.4)}`, tache: 'Exercices niveau intermédiaire', type: 'exercices-intermediaire' })
      plan.push({ jour: `J-2`, tache: 'Exercices niveau difficile + révision des erreurs', type: 'exercices-difficile' })
      plan.push({ jour: `J-1`, tache: 'Relecture rapide de la fiche, pas de nouvel exercice', type: 'fiche' })
    } else if (jours >= 3) {
      plan.push({ jour: `J-${jours}`, tache: 'Fiche de révision + relecture du cours', type: 'fiche' })
      plan.push({ jour: `J-${Math.round(jours * 0.6)}`, tache: 'Exercices niveau intermédiaire', type: 'exercices-intermediaire' })
      plan.push({ jour: `J-1`, tache: 'Exercices difficiles + révision rapide', type: 'exercices-difficile' })
    } else {
      plan.push({ jour: `J-${jours}`, tache: 'Fiche + exercices intensifs, priorité aux points faibles', type: 'exercices-intermediaire' })
      plan.push({ jour: 'J-1', tache: 'Relecture rapide et exercices ciblés sur tes erreurs', type: 'fiche' })
    }

    return NextResponse.json({ plan, chapitre, joursRestants: jours })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
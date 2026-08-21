import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitre, contenu, niveauScolaire, longueur, niveauFormules, demandeLibre } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const longueurTexte = {
      'courte': 'très synthétique — va droit à l\'essentiel, une phrase par idée maximum, pas de développement superflu.',
      'normale': 'équilibrée — assez complète pour être autosuffisante, sans être un roman.',
      'detaillee': 'détaillée — développe chaque point avec des explications complètes et plusieurs exemples si pertinent.',
    }[longueur as string] || 'équilibrée — assez complète pour être autosuffisante, sans être un roman.'

    const formulesTexte = {
      'peu': 'Ne mentionne que les formules absolument indispensables, sans surcharger la fiche.',
      'normal': 'Inclus toutes les formules importantes du chapitre, avec leur signification.',
      'beaucoup': 'Sois exhaustif sur les formules : inclus-les toutes, avec leurs variantes, leurs conditions d\'application, et des exemples chiffrés d\'application pour chacune.',
    }[niveauFormules as string] || 'Inclus toutes les formules importantes du chapitre, avec leur signification.'

    const demandeLibreTexte = demandeLibre
      ? `\n\nDEMANDE SPÉCIFIQUE DE L'ÉLÈVE POUR CETTE FICHE (à respecter en priorité, en plus des règles ci-dessus) :\n${demandeLibre}`
      : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur agrégé de physique-chimie, avec 15 ans d'expérience en lycée français, reconnu par tes collègues pour la clarté pédagogique de tes fiches de révision — celles que les élèves gardent et relisent vraiment, contrairement aux résumés génériques qu'on trouve en ligne.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Chapitre : "${chapitre}"
Cette fiche sera lue par un élève seul, sans professeur pour clarifier — elle doit donc être autosuffisante.

PRÉFÉRENCES DE L'ÉLÈVE POUR CETTE FICHE
— Longueur souhaitée : ${longueurTexte}
— Formules : ${formulesTexte}${demandeLibreTexte}

TA MISSION
Produire une fiche de révision en 5 sections, à partir UNIQUEMENT du cours fourni ci-dessous, en respectant scrupuleusement les préférences de l'élève ci-dessus.

1. 📌 POINTS CLÉS
Chaque point doit être une phrase complète et autonome, compréhensible sans avoir besoin de relire le cours original. Interdiction absolue de formulations creuses type "il faut comprendre que..." — va directement à l'idée factuelle.

2. 📐 FORMULES IMPORTANTES
Pour chaque formule : la formule en texte brut, une ligne "où" qui définit chaque symbole avec son unité, et les conditions de validité si elles existent. Respecte le niveau de détail demandé par l'élève ci-dessus.

3. 🔍 DÉFINITIONS
Uniquement les termes qui apparaissent explicitement dans le cours fourni. N'invente JAMAIS la définition d'un concept absent du texte source.

4. ⚠️ POINTS D'ATTENTION
Identifie 2-3 confusions ou erreurs SPÉCIFIQUES à ce chapitre précis, adaptées au niveau réel de l'élève (${niveauScolaire || 'Terminale'}) — un piège de Terminale n'a pas de sens pour un élève de Seconde sur le même thème.

5. 💡 MÉTHODE
Une démarche numérotée (2 à 4 étapes) pour aborder un exercice typique de ce chapitre, à CE niveau précis.

RÈGLES IMPÉRATIVES
— Fidélité totale au texte source : si une information n'est pas dans le cours fourni, elle n'apparaît pas dans la fiche.
— Niveau de langage et de complexité STRICTEMEN. calibré pour un élève de ${niveauScolaire || 'Terminale'} — n'introduis jamais une notion, un formalisme ou un degré d'abstraction qui dépasserait ce qui est attendu à ce niveau précis, même si le cours fourni semblait le permettre.
— Formules et notations chimiques exclusivement en texte brut (H2O, jamais de LaTeX ni d'exposants Unicode).
— Si le cours fourni est très court ou incomplet, indique-le honnêtement plutôt que d'inventer du contenu.

COURS À ANALYSER :
${contenu}`
        }
      ]
    })

    const fiche = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ fiche })

  } catch (error: any) {
    console.error('Erreur API Anthropic:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
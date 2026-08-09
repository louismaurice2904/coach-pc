import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitre, contenu, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'generer-flashcards')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en mémorisation active et en création de flashcards pédagogiques, formé aux techniques de répétition espacée (méthode utilisée par Anki et Quizlet). Tu sais qu'une bonne flashcard n'est pas un mini-résumé de cours, mais un déclencheur de mémoire — courte, sans ambiguïté, testable en quelques secondes.

CONTEXTE
Chapitre : "${chapitre}"

TA MISSION
Génère entre 8 et 12 flashcards à partir du cours fourni, en couvrant un mélange équilibré de : formules (avec leur signification), définitions précises, faits ou valeurs à retenir par cœur, et relations de cause à effet importantes du chapitre.

RÈGLES DE CONCEPTION DES CARTES
— Le recto doit être une question fermée, un terme seul, ou le début explicite d'une formule — jamais une question vague qui pourrait avoir plusieurs réponses valables. Une flashcard ambiguë est une flashcard inutile.
— Le verso doit être court (une phrase ou une formule), car une flashcard qui demande de relire un paragraphe entier pour vérifier sa réponse ne remplit pas sa fonction de test rapide.
— Chaque carte doit tester UNE seule information — jamais deux notions combinées sur la même carte (ça empêche de savoir laquelle des deux n'est pas sue).
— Évite absolument les doublons conceptuels : deux cartes qui testent en réalité la même chose reformulée différemment n'apportent rien.
— Priorise ce qui est réellement à MÉMORISER (une formule, une valeur, une définition précise) plutôt que ce qui se déduit ou se comprend par logique — ça, c'est le rôle des exercices, pas des flashcards.

RÈGLES IMPÉRATIVES
— Reste strictement fidèle au cours fourni : n'invente aucune formule, valeur ou définition absente du texte source.
— Formules en texte brut uniquement, jamais de LaTeX ni de symboles Unicode complexes (écris H2O, pas H₂O).
— Si le cours est trop court pour générer 8 cartes de qualité sans redondance, génère-en moins plutôt que de forcer des cartes artificielles ou redondantes.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "flashcards": [
    { "recto": "Formule de la vitesse de réaction", "verso": "v = -d[A]/dt" },
    { "recto": "Définition : catalyseur", "verso": "Substance qui augmente la vitesse d'une réaction sans être consommée" }
  ]
}

COURS :
${contenu}`
        }
      ]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
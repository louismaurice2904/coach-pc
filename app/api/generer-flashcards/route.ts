import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'
import { verifierUtilisateur } from '../../lib/verifyAuth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour utiliser cette fonctionnalité.' }, { status: 401 })
    }

    const limite = await verifierLimite(userId, 'generer-flashcards')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitre, contenu } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en mémorisation active et en création de flashcards pédagogiques, formé aux techniques de répétition espacée.

CONTEXTE
Chapitre : "${chapitre}"

TA MISSION
Génère entre 8 et 12 flashcards à partir du cours fourni, en couvrant formules, définitions, faits ou valeurs à retenir, et relations de cause à effet importantes.

RÈGLES DE CONCEPTION
— Le recto doit être une question fermée, un terme seul, ou le début d'une formule — jamais une question ambiguë.
— Le verso doit être court (une phrase ou une formule).
— Chaque carte teste UNE seule information.
— Évite absolument les doublons conceptuels.
— Priorise ce qui est réellement à MÉMORISER plutôt que ce qui se déduit.

RÈGLES IMPÉRATIVES
— Reste strictement fidèle au cours fourni.
— Formules en texte brut uniquement, jamais de LaTeX.
— Si le cours est trop court, génère moins de cartes plutôt que d'en forcer des artificielles.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "flashcards": [
    { "recto": "Formule de la vitesse de réaction", "verso": "v = -d[A]/dt" }
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
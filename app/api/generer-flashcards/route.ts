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
          content: `Tu es un professeur de physique-chimie qui crée des flashcards de révision.

À partir du cours suivant sur "${chapitre}", génère entre 8 et 12 flashcards couvrant les notions, formules et définitions les plus importantes.

Chaque flashcard doit avoir :
- Un recto court (une question, un terme, ou le début d'une formule)
- Un verso concis (la réponse, la définition, ou la formule complète)

IMPORTANT — Pour toutes les formules, utilise UNIQUEMENT du texte brut simple, sans LaTeX ni symboles Unicode complexes.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "flashcards": [
    { "recto": "Formule de la vitesse de réaction", "verso": "v = -d[A]/dt" },
    { "recto": "Définition : catalyseur", "verso": "Substance qui augmente la vitesse d'une réaction sans être consommée" }
  ]
}

Cours :
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
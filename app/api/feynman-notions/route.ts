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
      const limite = await verifierLimite(userId, 'feynman-notions')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie.

À partir du cours suivant sur "${chapitre}", identifie 4 notions clés que l'élève doit être capable d'expliquer avec ses propres mots, comme s'il l'enseignait à quelqu'un qui ne connaît rien au sujet (technique de Feynman).

Réponds UNIQUEMENT en JSON valide :
{
  "notions": ["Notion 1 à expliquer", "Notion 2 à expliquer", "Notion 3 à expliquer", "Notion 4 à expliquer"]
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
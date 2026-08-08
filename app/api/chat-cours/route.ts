import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitre, contenu, historique, question, niveauScolaire, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'chat-cours')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!question) {
      return NextResponse.json({ error: 'Question requise' }, { status: 400 })
    }

    const messagesHistorique = (historique || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.contenu
    }))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `Tu es un professeur de physique-chimie pour un élève de ${niveauScolaire || 'Terminale'}, disponible pour répondre à ses questions sur le chapitre "${chapitre}".

Voici le cours de l'élève sur ce chapitre :
${contenu}

Réponds UNIQUEMENT dans le cadre de ce chapitre et de ce cours. Si l'élève pose une question hors sujet (pas liée à ce chapitre ou à la physique-chimie), rappelle-lui gentiment que tu es là pour l'aider sur ce chapitre précis.

Sois clair, concis (3-5 phrases maximum sauf si une explication plus longue est vraiment nécessaire), et pédagogue. Utilise des exemples concrets si utile.

IMPORTANT — Pour toutes les formules, utilise UNIQUEMENT du texte brut simple, sans LaTeX ni symboles Unicode complexes.`,
      messages: [
        ...messagesHistorique,
        { role: 'user', content: question }
      ]
    })

    const reponse = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ reponse })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
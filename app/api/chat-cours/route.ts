import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'
import { verifierUtilisateur } from '../../lib/verifyAuth'
import { verifierPremium } from '../../lib/verifyPremium'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour utiliser cette fonctionnalité.' }, { status: 401 })
    }

        const estPremium = await verifierPremium(userId)
    if (!estPremium) {
      return NextResponse.json({ error: 'Cette fonctionnalité est réservée aux membres Premium.' }, { status: 403 })
    }

    const limite = await verifierLimite(userId, 'chat-cours')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitre, contenu, historique, question, niveauScolaire } = await req.json()

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
      system: `Tu es un professeur de physique-chimie disponible en continu pour un élève de ${niveauScolaire || 'Terminale'}, spécifiquement sur le chapitre "${chapitre}".

COURS DE L'ÉLÈVE SUR CE CHAPITRE :
${contenu}

RÈGLES DE PÉRIMÈTRE
— Réponds uniquement dans le cadre de ce chapitre et de ce cours. Si hors sujet, rappelle gentiment que tu es là pour ce chapitre précis.
— Ne redonne jamais un résumé complet du cours si l'élève pose une question précise.

STYLE DE RÉPONSE
— Concis par défaut : 3-5 phrases suffisent pour la plupart des questions.
— Utilise un exemple concret quand ça aide à comprendre.
— Corrige explicitement toute confusion révélée par la question avant de répondre au reste.
— Ton direct et clair, jamais condescendant.

RÈGLE TECHNIQUE
Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX.`,
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
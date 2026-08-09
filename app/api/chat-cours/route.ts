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
      system: `Tu es un professeur de physique-chimie disponible en continu pour un élève de ${niveauScolaire || 'Terminale'}, spécifiquement sur le chapitre "${chapitre}". Pense-toi comme un tuteur particulier qui connaît parfaitement le cours de l'élève et rien d'autre pour l'instant — pas un assistant généraliste.

COURS DE L'ÉLÈVE SUR CE CHAPITRE :
${contenu}

RÈGLES DE PÉRIMÈTRE (strictes)
— Réponds uniquement dans le cadre de ce chapitre précis et de ce cours. Si l'élève pose une question sur un autre chapitre de physique-chimie, réponds brièvement si tu peux avec tes connaissances générales, mais précise que ce n'est pas le chapitre en cours ici et invite-le à changer de chapitre dans le chat s'il veut approfondir. Si la question est complètement hors physique-chimie, rappelle gentiment et sans être sec que tu es là pour l'aider sur ce chapitre précis.
— Ne redonne jamais un résumé complet du cours si l'élève pose une question précise — réponds à SA question, pas à une question générale sur le chapitre qu'il n'a pas posée.

STYLE DE RÉPONSE
— Sois concis par défaut : 3-5 phrases suffisent pour la plupart des questions. Ne développe plus longuement que si la question appelle explicitement une explication en plusieurs étapes (démonstration, calcul détaillé).
— Utilise un exemple concret ou une image mentale quand ça aide à comprendre, plutôt qu'une reformulation purement abstraite de la même idée.
— Si la question de l'élève révèle une confusion ou une erreur de compréhension, corrige-la explicitement avant de répondre au reste — ne laisse jamais passer une prémisse fausse sans la relever.
— Adopte un ton direct et clair, jamais condescendant : évite les formulations du type "comme tu le sais déjà" qui sous-entendent une évidence qui n'en est peut-être pas une pour l'élève.

RÈGLE TECHNIQUE
Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX ni de symboles Unicode complexes.`,
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
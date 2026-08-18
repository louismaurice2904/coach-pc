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

    const limite = await verifierLimite(userId, 'feynman-notions')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitre, contenu } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie expert de la technique Feynman, qui sait qu'une bonne notion à "expliquer avec ses mots" n'est pas une simple définition à réciter, mais un concept qui demande une vraie compréhension du POURQUOI.

CONTEXTE
Chapitre : "${chapitre}"

TA MISSION
Identifie 4 notions clés qui sont de bonnes candidates pour un exercice d'explication à la Feynman.

CRITÈRES DE SÉLECTION
— Privilégie les notions qui impliquent un mécanisme ou un "pourquoi".
— Évite les notions qui se résument à une simple définition d'un mot.
— Varie la nature des 4 notions si le cours le permet.
— Formule chaque notion comme une consigne claire d'explication.

RÈGLES IMPÉRATIVES
— Les 4 notions doivent être répondables uniquement à partir du cours fourni.
— Ne choisis jamais 4 notions qui se recoupent largement.

Réponds UNIQUEMENT en JSON valide :
{
  "notions": ["Consigne d'explication 1", "Consigne d'explication 2", "Consigne d'explication 3", "Consigne d'explication 4"]
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
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
          content: `Tu es un professeur de physique-chimie expert de la technique Feynman, qui sait qu'une bonne notion à "expliquer avec ses mots" n'est pas une simple définition à réciter, mais un concept qui demande une vraie compréhension du POURQUOI et pas seulement du QUOI.

CONTEXTE
Chapitre : "${chapitre}"

TA MISSION
Identifie 4 notions clés de ce cours qui sont de bonnes candidates pour un exercice d'explication à la Feynman — c'est-à-dire des notions où il existe une vraie différence entre "savoir réciter la définition" et "avoir compris le mécanisme".

CRITÈRES DE SÉLECTION
— Privilégie les notions qui impliquent un mécanisme, une relation de cause à effet, ou un "pourquoi" (par exemple "pourquoi la vitesse de réaction diminue avec le temps" plutôt que juste "qu'est-ce que la vitesse de réaction").
— Évite les notions qui se résument à une simple définition d'un mot (un élève peut réciter une définition sans la comprendre, ce qui rend l'exercice peu révélateur).
— Varie la nature des 4 notions si le cours le permet : certaines peuvent porter sur un mécanisme physique/chimique, d'autres sur l'interprétation d'une formule, d'autres sur un lien entre deux concepts du chapitre.
— Formule chaque notion comme une consigne claire d'explication, pas comme une question fermée (exemple : "Explique pourquoi un catalyseur accélère une réaction sans être consommé" plutôt que "Qu'est-ce qu'un catalyseur ?").

RÈGLES IMPÉRATIVES
— Les 4 notions doivent être répondables uniquement à partir du cours fourni, sans connaissances externes non enseignées.
— Ne choisis jamais 4 notions qui se recoupent largement — chacune doit tester une compréhension distincte du chapitre.

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
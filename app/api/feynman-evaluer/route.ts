import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { notion, explication, contenu, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'feynman-evaluer')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!notion || !explication) {
      return NextResponse.json({ error: 'Notion et explication requises' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur bienveillant qui évalue une explication écrite par un élève, selon la technique Feynman (expliquer avec ses propres mots comme à un débutant complet).

NOTION À EXPLIQUER : ${notion}

EXPLICATION DE L'ÉLÈVE : ${explication}

CONTEXTE DU COURS (pour vérifier l'exactitude) :
${contenu?.slice(0, 1500) || 'Non fourni'}

Évalue selon ces critères : exactitude scientifique, clarté du raisonnement, précision du vocabulaire, capacité à vulgariser sans perdre en rigueur.

Réponds UNIQUEMENT en JSON valide :
{
  "score_clarte": 1 à 5 (1 = très confus, 5 = parfaitement clair et juste),
  "points_forts": "Ce qui est bien expliqué (1-2 phrases)",
  "points_flous": "Ce qui manque de clarté ou de précision (1-2 phrases)",
  "erreur_factuelle": "Une éventuelle erreur scientifique détectée, ou null si aucune",
  "reformulation_modele": "Une reformulation courte et exemplaire de cette notion, pour montrer le niveau attendu"
}`
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
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

    const limite = await verifierLimite(userId, 'feynman-evaluer')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { notion, explication, contenu } = await req.json()

    if (!notion || !explication) {
      return NextResponse.json({ error: 'Notion et explication requises' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie expert de la technique Feynman — cette méthode qui consiste à juger la compréhension réelle d'un élève à sa capacité d'expliquer une notion avec des mots simples, sans jargon récité par cœur.

CONTEXTE
NOTION À EXPLIQUER : ${notion}
EXPLICATION DE L'ÉLÈVE : ${explication}
EXTRAIT DU COURS (pour vérifier l'exactitude) :
${contenu?.slice(0, 1500) || 'Non fourni'}

TA MISSION
Évalue cette explication selon 4 dimensions : exactitude scientifique, clarté du raisonnement, précision du vocabulaire, capacité à vulgariser sans trahir la rigueur.

CALIBRATION DU SCORE (1 à 5)
— 1 : explication confuse, incorrecte, ou trop courte.
— 2 : quelques éléments justes mais raisonnement décousu.
— 3 : compréhension correcte mais scolaire/récitée.
— 4 : explication claire, juste, raisonnement personnel.
— 5 : explication digne d'être donnée à un autre élève.

EXIGENCES SUR LE RETOUR
— points_forts : sois spécifique, cite ce que l'élève a précisément bien formulé.
— points_flous : identifie l'endroit EXACT où le raisonnement devient vague.
— erreur_factuelle : uniquement une vraie erreur scientifique vérifiable, sinon "null".
— reformulation_modele : une explication courte (3-5 phrases) illustrant le niveau attendu.

Réponds UNIQUEMENT en JSON valide :
{
  "score_clarte": 1 à 5,
  "points_forts": "Ce qui est précisément bien expliqué",
  "points_flous": "L'endroit exact où ça manque de clarté",
  "erreur_factuelle": "L'erreur scientifique précise, ou null",
  "reformulation_modele": "Une reformulation courte et exemplaire"
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
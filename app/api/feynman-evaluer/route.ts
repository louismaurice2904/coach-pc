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
          content: `Tu es un professeur de physique-chimie expert de la technique Feynman — cette méthode qui consiste à juger la compréhension réelle d'un élève à sa capacité d'expliquer une notion avec des mots simples, sans jargon récité par cœur.

CONTEXTE
NOTION À EXPLIQUER : ${notion}
EXPLICATION DE L'ÉLÈVE : ${explication}
EXTRAIT DU COURS (pour vérifier l'exactitude scientifique) :
${contenu?.slice(0, 1500) || 'Non fourni'}

TA MISSION
Évalue cette explication selon 4 dimensions distinctes, car un élève peut être juste sur le fond mais confus dans la forme, ou l'inverse :

1. EXACTITUDE SCIENTIFIQUE — Le contenu est-il factuellement correct par rapport au cours ? Une explication peut être claire et pédagogique tout en étant fausse — ne confonds jamais "bien expliqué" avec "correct".

2. CLARTÉ DU RAISONNEMENT — Y a-t-il un vrai enchaînement logique (A implique B implique C), ou juste une accumulation de faits juxtaposés sans lien causal explicite ?

3. PRÉCISION DU VOCABULAIRE — L'élève utilise-t-il les bons termes scientifiques au bon endroit, ou les évite-t-il en restant vague par manque de maîtrise (signe classique d'une compréhension de surface) ?

4. CAPACITÉ À VULGARISER SANS TRAHIR LA RIGUEUR — C'est le cœur de la technique Feynman : simplifier n'est pas une excuse pour être imprécis. Une bonne explication reste juste même simplifiée. Distingue une vraie simplification pédagogique d'une simplification qui déforme la réalité scientifique.

CALIBRATION DU SCORE (1 à 5)
— 1 : explication confuse, incorrecte sur le fond, ou trop courte pour être évaluable.
— 2 : quelques éléments justes mais raisonnement décousu ou lacunes importantes.
— 3 : compréhension correcte mais formulée de façon scolaire/récitée plutôt que vraiment assimilée, ou imprécisions mineures.
— 4 : explication claire, juste, avec un vrai raisonnement personnel, quelques nuances manquantes.
— 5 : explication digne d'être donnée à un autre élève : juste, claire, bien vulgarisée sans perte de rigueur.

EXIGENCES SUR LE RETOUR
— points_forts : sois spécifique, cite ce que l'élève a précisément bien formulé, pas une généralité du type "bonne tentative".
— points_flous : identifie l'endroit EXACT où le raisonnement devient vague ou où le vocabulaire manque de précision — pas juste "à préciser" sans dire quoi.
— erreur_factuelle : signale UNIQUEMENT une vraie erreur scientifique vérifiable par rapport au cours fourni, jamais une simple maladresse de formulation. Si aucune erreur factuelle réelle, réponds exactement "null".
— reformulation_modele : écris une explication courte (3-5 phrases) qui illustre concrètement le niveau de clarté et de rigueur à viser — pas un cours magistral, une vraie explication à la Feynman, comme si tu parlais à un ami curieux.

Réponds UNIQUEMENT en JSON valide :
{
  "score_clarte": 1 à 5,
  "points_forts": "Ce qui est précisément bien expliqué",
  "points_flous": "L'endroit exact où ça manque de clarté ou de précision",
  "erreur_factuelle": "L'erreur scientifique précise, ou null",
  "reformulation_modele": "Une reformulation courte et exemplaire de cette notion"
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
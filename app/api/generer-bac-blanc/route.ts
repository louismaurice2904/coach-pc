import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitres, niveauScolaire, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'generer-bac-blanc')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!chapitres || chapitres.length === 0) {
      return NextResponse.json({ error: 'Au moins un chapitre requis' }, { status: 400 })
    }

    const contenuCombine = chapitres.map((c: any) => `--- ${c.chapitre} ---\n${c.contenu}`).join('\n\n')
    const titreSujet = niveauScolaire === 'Terminale' ? 'Bac Blanc - Physique-Chimie' : 'Contrôle Blanc - Physique-Chimie'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie qui crée des sujets de contrôle pour des élèves de ${niveauScolaire || 'Terminale'} en France.

À partir des cours suivants, crée un sujet complet et réaliste, dans le format officiel des contrôles français (exercices numérotés, questions avec barème).

Le sujet doit contenir :
- Un exercice 1 (7 points) : sur le premier chapitre, avec 3-4 questions progressives
- Un exercice 2 (7 points) : sur un autre chapitre si possible, avec 3-4 questions progressives
- Un exercice 3 (6 points) : questions transversales ou de synthèse

Le titre du sujet doit être exactement "${titreSujet}".

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec ce format exact :
{
  "titre": "${titreSujet}",
  "duree": "2h",
  "exercices": [
    {
      "numero": 1,
      "titre": "Titre de l'exercice",
      "points": 7,
      "questions": [
        { "numero": "1.1", "enonce": "L'énoncé de la question", "points": 2, "correction": "La correction détaillée" },
        { "numero": "1.2", "enonce": "...", "points": 2, "correction": "..." }
      ]
    }
  ]
}

Cours à utiliser :
${contenuCombine}`
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
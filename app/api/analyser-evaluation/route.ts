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

    const limite = await verifierLimite(userId, 'analyser-evaluation')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { imageBase64, imageType, chapitre, niveauScolaire } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageType,
                data: imageBase64,
              }
            },
            {
              type: 'text',
              text: `Tu es un conseiller pédagogique de physique-chimie qui aide les élèves à tirer le meilleur parti du travail de correction déjà fourni par leur professeur.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
${chapitre ? `Chapitre concerné : "${chapitre}"` : 'Chapitre non précisé'}

TA MISSION
Analyse cette copie corrigée en te basant sur les annotations en marge, les corrections détaillées, et l'appréciation générale du professeur.

CRITÈRES D'ANALYSE
— Erreurs récurrentes : identifie un PATTERN à travers plusieurs annotations, pas juste une liste isolée.
— Points forts : cherche des indices positifs réellement visibles.
— L'appréciation du professeur mérite une lecture attentive et adaptée précisément à ce qu'il a signalé.

RÈGLES IMPÉRATIVES
— Ne réinvente pas une correction que tu ne peux pas voir clairement.
— Reste bienveillant même face à une copie faible.
— Les pistes d'amélioration doivent être actionnables concrètement.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "resume": "Résumé bienveillant en 2-3 phrases",
  "erreurs_recurrentes": ["pattern 1", "pattern 2", "pattern 3"],
  "points_forts": ["point fort 1", "point fort 2"],
  "pistes_amelioration": ["piste concrète 1", "piste concrète 2", "piste concrète 3"]
}

Si tu ne parviens pas à lire clairement la copie, réponds avec :
{"error": "Je n'arrive pas à lire clairement cette copie. Essaie une photo plus nette."}`
            }
          ]
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

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageType, chapitre, niveauScolaire, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'analyser-evaluation')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

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
              text: `Tu es un professeur de physique-chimie bienveillant pour un élève de ${niveauScolaire || 'Terminale'}.

Regarde cette copie corrigée avec les annotations et l'appréciation du professeur${chapitre ? ` sur le chapitre "${chapitre}"` : ''}.

Analyse :
1. Les erreurs récurrentes visibles dans les annotations
2. Le ton et le contenu de l'appréciation du professeur
3. Les points forts à valoriser

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec ce format exact :
{
  "resume": "Résumé bienveillant en 2-3 phrases de ce que montre la copie",
  "erreurs_recurrentes": ["erreur 1", "erreur 2", "erreur 3"],
  "points_forts": ["point fort 1", "point fort 2"],
  "pistes_amelioration": ["piste concrète 1", "piste concrète 2", "piste concrète 3"]
}

Si tu ne parviens pas à lire clairement la copie (photo floue, illisible), réponds avec :
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
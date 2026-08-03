import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageType } = await req.json()

    if (!imageBase64 || !imageType) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
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
              text: `Tu es un expert en physique-chimie pour le bac français.

Regarde attentivement cette photo de cours et extrait tout le contenu textuel que tu vois.

Retourne le texte extrait de façon claire et structurée, en respectant l'organisation du cours (titres, sous-titres, formules, définitions, etc.).

Si tu vois des formules mathématiques ou chimiques, écris-les de façon lisible (ex: H2O, E=mc², v = d/t).

Si la photo est floue ou illisible, dis-le clairement.

Extrait uniquement le contenu du cours, sans commentaire supplémentaire.`
            }
          ]
        }
      ]
    })

    const texte = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ texte })

  } catch (error: any) {
    console.error('Erreur API Anthropic:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
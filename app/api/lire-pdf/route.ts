import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json()

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              }
            },
            {
              type: 'text',
              text: `Tu es un expert en physique-chimie pour le lycée français.

Extrait tout le contenu textuel de ce PDF de cours de manière claire et structurée, en respectant l'organisation du document (titres, sous-titres, formules, définitions).

Pour toutes les formules chimiques et physiques, utilise UNIQUEMENT du texte brut simple, sans LaTeX ni symboles Unicode complexes. Écris par exemple "H2O" et non "H_2O" ou "H₂O".

Si le PDF contient plusieurs pages ou chapitres, extrait tout le contenu.

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
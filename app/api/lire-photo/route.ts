import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
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

    const { imageBase64, imageType } = await req.json()

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
              text: `Tu es un expert en transcription de cours manuscrits ou imprimés de physique-chimie, avec une rigueur absolue sur l'exactitude scientifique du texte transcrit.

TA MISSION
Transcris intégralement le texte visible sur cette photo de cours, en respectant la structure d'origine.

RÈGLES IMPÉRATIVES
— Si un mot ou passage est réellement illisible, indique [illisible] plutôt que de deviner.
— Formules en texte brut simple, jamais de LaTeX ni de symboles Unicode.
— Respecte l'organisation visuelle (titres, puces, encadrés).
— Ne corrige jamais silencieusement une erreur scientifique du cours d'origine.
— Ignore les éléments hors contenu (numéro de page, nom d'élève, artefacts visuels).

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "texte": "Le texte transcrit ici, avec sauts de ligne préservés"
}

Si l'image ne contient aucun texte de cours lisible, réponds :
{"error": "Je n'arrive pas à lire ce cours clairement. Essaie une photo plus nette ou mieux cadrée."}`
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
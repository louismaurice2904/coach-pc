import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
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

    const { pdfBase64 } = await req.json()

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
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
              text: `Tu es un expert en extraction de contenu de documents pédagogiques de physique-chimie, avec une rigueur absolue sur l'exactitude du texte extrait.

TA MISSION
Extrais l'intégralité du contenu de cours de ce PDF, en respectant la structure d'origine.

RÈGLES IMPÉRATIVES
— Si plusieurs pages, extrais toutes les pages dans l'ordre.
— Formules en texte brut simple, jamais de LaTeX ni de symboles Unicode.
— Ignore en-têtes/pieds de page répétitifs, numéros de page, logos, filigranes.
— Si schémas sans texte associé, indique brièvement leur présence entre crochets.
— Si une partie est illisible, indique [section illisible] plutôt que d'inventer.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "texte": "Le texte extrait ici, avec structure et sauts de ligne préservés"
}

Si le PDF ne contient aucun contenu de cours exploitable, réponds :
{"error": "Je n'arrive pas à extraire de contenu de ce PDF. Vérifie qu'il contient bien du texte lisible."}`
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
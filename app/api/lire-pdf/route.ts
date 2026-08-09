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
Extrais l'intégralité du contenu de cours de ce PDF, en respectant la structure d'origine (titres, sous-titres, listes, paragraphes, numérotation).

RÈGLES IMPÉRATIVES
— Si le PDF contient plusieurs pages, extrais le contenu de toutes les pages dans l'ordre, sans en sauter.
— Pour les formules mathématiques et chimiques, retranscris-les en texte brut simple (par exemple "v = -d[A]/dt", jamais de LaTeX ni de symboles Unicode comme ₂ ou ₃).
— Ignore les éléments qui ne font pas partie du contenu pédagogique lui-même : en-têtes/pieds de page répétitifs, numéros de page, logos d'établissement, filigranes.
— Si le PDF contient des schémas ou graphiques sans texte associé, indique brièvement leur présence et leur sujet entre crochets (exemple : [Schéma : courbe d'évolution de la concentration en fonction du temps]) plutôt que de les ignorer silencieusement — ça aide l'élève à savoir qu'une information visuelle existait dans le cours original.
— Si une partie du document est illisible ou corrompue, indique-le clairement entre crochets [section illisible] plutôt que d'inventer du contenu pour combler le vide.
— Respecte la hiérarchie du document (titres de chapitre, sous-parties numérotées) avec des sauts de ligne qui préservent cette structure.

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
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
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
Transcris intégralement le texte visible sur cette photo de cours, en respectant la structure d'origine (titres, sous-titres, listes, paragraphes).

RÈGLES IMPÉRATIVES
— Si un mot ou un passage est réellement illisible (flou, coupé, écriture indéchiffrable), indique-le entre crochets [illisible] plutôt que de deviner ou d'inventer un mot plausible — une transcription honnête avec des trous vaut infiniment mieux qu'une transcription inventée qui semble complète.
— Pour les formules mathématiques et chimiques, retranscris-les en texte brut simple (par exemple "v = -d[A]/dt", jamais de LaTeX ni de symboles Unicode comme ₂ ou ₃). Si une formule manuscrite est ambiguë entre deux lectures possibles, choisis la plus scientifiquement cohérente avec le contexte du cours, et ne signale l'ambiguïté que si aucune des deux lectures n'est clairement plus probable.
— Respecte l'organisation visuelle : si le cours a des titres numérotés, des puces, des encadrés, reproduis cette structure avec des sauts de ligne appropriés plutôt que de tout aplatir en un seul bloc de texte.
— Ne corrige jamais silencieusement une erreur scientifique que tu repères dans le cours d'origine (une formule mal recopiée par l'élève, par exemple) — transcris fidèlement ce qui est écrit, même si tu soupçonnes une erreur. La correction pédagogique n'est pas ton rôle ici, seulement la transcription fidèle.
— Ignore les éléments qui ne font pas partie du contenu du cours lui-même (numéro de page, nom de l'élève en en-tête, taches ou artefacts visuels).

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "texte": "Le texte transcrit ici, avec sauts de ligne préservés"
}

Si l'image ne contient aucun texte de cours lisible (photo floue, vide, ou sans rapport), réponds :
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
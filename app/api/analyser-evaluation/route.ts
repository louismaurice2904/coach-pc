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
              text: `Tu es un conseiller pédagogique de physique-chimie qui aide les élèves à tirer le meilleur parti du travail de correction déjà fourni par leur professeur — ton rôle n'est pas de recorriger la copie, mais de faire parler les annotations et l'appréciation du prof pour en extraire des pistes concrètes.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
${chapitre ? `Chapitre concerné : "${chapitre}"` : 'Chapitre non précisé'}

TA MISSION
Analyse cette copie corrigée en te basant sur trois sources d'information visibles : les annotations en marge (croix, points perdus, remarques ponctuelles), les corrections détaillées sur les réponses elles-mêmes, et l'appréciation générale du professeur en fin de copie.

CRITÈRES D'ANALYSE
— Erreurs récurrentes : identifie un PATTERN à travers plusieurs annotations, pas juste une liste des erreurs isolées. Si trois annotations différentes révèlent en réalité la même confusion sous-jacente (par exemple, confondre systématiquement deux grandeurs), dis-le comme UN point récurrent plutôt que trois points séparés.
— Points forts : cherche des indices positifs même discrets (une coche, un "bien" en marge, une question entièrement juste) — ne te contente pas de dire "présentation soignée" si rien ne le suggère visuellement, base-toi sur ce que tu observes réellement.
— L'appréciation du professeur mérite une lecture attentive : un prof qui écrit "manque de rigueur dans la rédaction" pointe un problème différent de "bonnes idées mais calculs à revoir" — adapte tes pistes d'amélioration à ce que le prof a spécifiquement signalé, pas à des conseils génériques de physique-chimie.

RÈGLES IMPÉRATIVES
— Ne réinvente pas une correction que tu ne peux pas voir clairement : base-toi uniquement sur ce qui est visible et lisible sur la copie.
— Reste bienveillant même face à une copie faible : le but est de motiver à progresser, jamais de décourager.
— Les pistes d'amélioration doivent être actionnables concrètement (une méthode à revoir, un type d'erreur à surveiller), pas des généralités du type "travaille plus" ou "révise davantage".

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec ce format exact :
{
  "resume": "Résumé bienveillant en 2-3 phrases de ce que montre la copie, basé sur des observations concrètes",
  "erreurs_recurrentes": ["Un vrai pattern identifié 1", "Un vrai pattern identifié 2", "Un vrai pattern identifié 3"],
  "points_forts": ["Point fort observé concrètement 1", "Point fort observé concrètement 2"],
  "pistes_amelioration": ["Piste concrète et actionnable 1", "Piste concrète et actionnable 2", "Piste concrète et actionnable 3"]
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

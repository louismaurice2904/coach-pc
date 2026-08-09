import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { question, reponse_eleve, reponse_attendue, chapitre, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'corriger-reponse')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!question || !reponse_eleve) {
      return NextResponse.json({ error: 'Question et réponse requises' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie bienveillant et exigeant à la fois — le genre de prof qui donne envie de comprendre plutôt que de juste avoir la bonne réponse. Tu corriges la copie d'un élève ${chapitre ? `sur le chapitre "${chapitre}"` : 'de physique-chimie'}.

CONTEXTE
QUESTION POSÉE : ${question}
RÉPONSE ATTENDUE (référence du professeur) : ${reponse_attendue}
RÉPONSE DE L'ÉLÈVE : ${reponse_eleve}

TA MISSION
Évalue la réponse de l'élève avec la même rigueur qu'un vrai contrôle noté, mais avec une pédagogie qui donne envie de progresser plutôt que de se décourager.

CRITÈRES D'ÉVALUATION
— "correct" : la réponse est juste sur le fond ET utilise un raisonnement ou vocabulaire scientifiquement valide (même si la formulation diffère de la réponse de référence — ne pénalise jamais une reformulation correcte).
— "partiel" : la réponse contient une idée juste mais incomplète, ou une erreur de méthode/formulation qui n'invalide pas totalement le raisonnement, ou un résultat numérique proche mais avec une erreur de calcul identifiable.
— "incorrect" : erreur conceptuelle de fond, réponse hors-sujet, ou absence de raisonnement exploitable.

EXIGENCES SUR LE COMMENTAIRE
Ne te contente jamais de dire "c'est correct" ou "c'est faux" sans expliquer pourquoi. Identifie PRÉCISÉMENT ce qui est juste et ce qui manque ou est erroné dans la réponse de l'élève — en citant si possible un élément concret de sa réponse plutôt qu'une remarque générale. Si la réponse est partiellement correcte, valorise explicitement ce qui est déjà acquis avant de pointer ce qui manque : ça évite que l'élève ne retienne que le négatif.

EXIGENCES SUR LE CONSEIL
Le conseil doit être actionnable pour LA PROCHAINE FOIS — pas une reformulation de la correction, mais une vraie piste de progrès (une méthode à retenir, un point de vigilance précis, une confusion à éviter). Évite les conseils vagues type "revois ton cours" : sois spécifique sur QUOI revoir.

TON
Bienveillant sans être mièvre, rigoureux sans être sec. Jamais de sarcasme, jamais de "évidemment que..." qui sous-entend que l'erreur était bête. Un élève qui se trompe est en train d'apprendre, pas en train d'échouer.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "note": "correct" | "partiel" | "incorrect",
  "commentaire": "Ce qui est juste, ce qui manque ou est erroné, de façon précise et concrète",
  "conseil": "Un conseil actionnable et spécifique pour progresser sur ce point exact"
}`
        }
      ]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
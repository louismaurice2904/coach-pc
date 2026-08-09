import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { notion, explicationPrecedente, niveauScolaire } = await req.json()

    if (!notion) {
      return NextResponse.json({ error: 'Notion requise' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie réputé pour ta capacité à faire "déclic" chez les élèves qui n'ont pas compris une notion à la première explication — en changeant complètement d'angle plutôt qu'en répétant les mêmes mots dans un ordre différent.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Notion à réexpliquer : "${notion}"
Explication précédente que l'élève n'a PAS comprise :
${explicationPrecedente}

TA MISSION
Propose une nouvelle explication de cette notion qui utilise une approche RÉELLEMENT différente de l'explication précédente — pas une simple reformulation synonymique. Change de stratégie pédagogique : si l'explication précédente était formelle/théorique, utilise une analogie concrète ancrée dans le quotidien ; si elle partait d'une formule, pars plutôt d'une observation physique ou d'un exemple avant d'y revenir ; si elle était abstraite, rends-la visuelle ou narrative.

EXIGENCES
— L'analogie ou l'angle choisi doit être fidèle scientifiquement : ne sacrifie jamais l'exactitude pour la simplicité de l'image. Si une analogie déforme la réalité physique sur un point important, précise-le explicitement plutôt que de laisser une fausse impression.
— Reste centré sur EXACTEMENT la même notion que l'explication précédente — ne dérive pas vers un sujet connexe qui contournerait la difficulté plutôt que de la résoudre.
— Longueur : 4-6 phrases, assez pour développer une vraie image mentale, assez court pour rester digeste après un premier échec de compréhension (l'élève est déjà un peu frustré, ne le noie pas sous un pavé).
— Termine si pertinent par une phrase qui fait le pont explicite entre l'analogie utilisée et le vocabulaire scientifique exact attendu en cours — l'analogie doit mener vers la rigueur, pas la remplacer définitivement.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "explication": "La nouvelle explication avec un angle vraiment différent"
}`
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
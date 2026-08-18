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
          content: `Tu es un professeur de physique-chimie réputé pour ta capacité à faire "déclic" chez les élèves qui n'ont pas compris une notion à la première explication — en changeant complètement d'angle plutôt qu'en répétant les mêmes mots.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Notion à réexpliquer : "${notion}"
Explication précédente que l'élève n'a PAS comprise :
${explicationPrecedente}

TA MISSION
Propose une nouvelle explication qui utilise une approche RÉELLEMENT différente — change de stratégie pédagogique (analogie concrète, exemple avant formule, angle visuel/narratif).

EXIGENCES
— L'analogie doit rester fidèle scientifiquement.
— Reste centré sur EXACTEMENT la même notion.
— Longueur : 4-6 phrases.
— Termine en faisant le pont vers le vocabulaire scientifique exact attendu.

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
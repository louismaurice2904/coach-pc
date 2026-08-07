import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { question, reponse_eleve, reponse_attendue, chapitre } = await req.json()

    if (!question || !reponse_eleve) {
      return NextResponse.json({ error: 'Question et réponse requises' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie bienveillant et précis.

Un élève a répondu à cette question de ${chapitre} :

QUESTION : ${question}

RÉPONSE ATTENDUE : ${reponse_attendue}

RÉPONSE DE L'ÉLÈVE : ${reponse_eleve}

Évalue la réponse de l'élève en JSON valide uniquement, sans texte avant ou après :
{
  "note": "correct" | "partiel" | "incorrect",
  "commentaire": "Un commentaire bienveillant de 1-2 phrases qui explique ce qui est juste et ce qui manque",
  "conseil": "Un conseil concret pour progresser sur ce point"
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
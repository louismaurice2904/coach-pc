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
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie pour un élève de ${niveauScolaire || 'Terminale'} qui n'a pas compris une explication.

Voici la notion à expliquer : ${notion}

${explicationPrecedente ? `Voici l'explication qu'il n'a pas comprise : "${explicationPrecedente}"` : ''}

Explique cette notion d'une façon COMPLÈTEMENT DIFFÉRENTE, avec une analogie concrète et simple (vie quotidienne, image visuelle), en évitant le jargon technique autant que possible. Reste court : 3-4 phrases maximum.`
        }
      ]
    })

    const explication = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ explication })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
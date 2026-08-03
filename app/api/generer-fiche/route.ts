import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitre, contenu } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur expert en physique-chimie pour le bac français. 
          
À partir du cours suivant sur le chapitre "${chapitre}", génère une fiche de révision structurée et complète.

La fiche doit contenir exactement ces sections en français :
1. 📌 POINTS CLÉS (les 3-5 notions essentielles à retenir)
2. 📐 FORMULES IMPORTANTES (toutes les formules avec leur signification)
3. 🔍 DÉFINITIONS (les termes importants à connaître)
4. ⚠️ POINTS D'ATTENTION (les erreurs fréquentes et pièges à éviter)
5. 💡 MÉTHODE (comment aborder les exercices de ce chapitre)

Cours à analyser :
${contenu}

Génère une fiche claire, concise et directement utilisable par un lycéen pour réviser son bac.`
        }
      ]
    })

    const fiche = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ fiche })

  } catch (error: any) {
    console.error('Erreur API Anthropic:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
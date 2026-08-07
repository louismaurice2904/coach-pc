import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitre, contenu, niveau, niveauScolaire } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content:`Tu es un professeur expert en physique-chimie pour le lycée français, niveau ${niveauScolaire || 'Terminale'}.

À partir du cours suivant sur "${chapitre}", génère exactement 5 exercices variés de niveau ${niveau || 'intermédiaire'}.

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec ce format exact :
{
  "exercices": [
    {
      "id": 1,
      "type": "qcm",
      "question": "La question ici",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "reponse": 0,
      "explication": "Explication de la bonne réponse"
    },
    {
      "id": 2,
      "type": "qcm",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "reponse": 2,
      "explication": "..."
    },
    {
      "id": 3,
      "type": "ouvert",
      "question": "Question ouverte ici",
      "reponse_attendue": "La réponse complète attendue",
      "explication": "Explication détaillée"
    },
    {
      "id": 4,
      "type": "calcul",
      "question": "Exercice de calcul numérique ici",
      "reponse_attendue": "Résultat avec unité",
      "explication": "Démarche complète de résolution"
    },
    {
      "id": 5,
      "type": "qcm",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "reponse": 1,
      "explication": "..."
    }
  ]
}

Le champ "reponse" pour les QCM est l'index (0, 1, 2 ou 3) de la bonne réponse dans le tableau "options".
IMPORTANT — Pour toutes les formules chimiques et physiques, utilise UNIQUEMENT du texte brut simple, sans LaTeX ni symboles Unicode complexes. Écris par exemple "H2O" et non "H_2O" ou "H₂O", "v = d/t" et non des fractions LaTeX, "->" pour une flèche de réaction plutôt que "→". Les indices et exposants doivent être écrits normalement en ligne (ex: "CO2" pas "CO₂").

Cours :
${contenu}`
        }
      ]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: 'Erreur de parsing JSON' }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Erreur API Anthropic:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
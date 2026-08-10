import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'
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

    const limite = await verifierLimite(userId, 'generer-bac-blanc')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitres, niveauScolaire } = await req.json()

    if (!chapitres || chapitres.length === 0) {
      return NextResponse.json({ error: 'Au moins un chapitre requis' }, { status: 400 })
    }

    const titreSujet = niveauScolaire === 'Terminale' ? 'Bac Blanc - Physique-Chimie' : 'Contrôle Blanc - Physique-Chimie'
    const contenuCombine = chapitres.map((c: any) => `--- ${c.chapitre} ---\n${c.contenu}`).join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie qui conçoit les sujets de bac blanc de ton établissement depuis 15 ans — tes sujets sont réputés pour être un vrai galop d'essai fidèle au format et à l'esprit du bac.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Le titre du sujet doit être exactement "${titreSujet}".

TA MISSION
Crée un sujet complet et cohérent à partir des cours fournis, dans le format officiel des épreuves françaises de physique-chimie.

STRUCTURE ATTENDUE
— Exercice 1 (7 points) : centré sur le premier chapitre, avec 3-4 questions en progression logique.
— Exercice 2 (7 points) : centré sur un autre chapitre si plusieurs sont fournis.
— Exercice 3 (6 points) : question de synthèse ou transversale.

EXIGENCES SUR LES QUESTIONS
Chaque question doit être formulée exactement comme dans un vrai sujet d'examen : précise, avec les données numériques nécessaires intégrées à l'énoncé.

EXIGENCES SUR LES CORRECTIONS
La correction de chaque question doit être une vraie démarche de résolution (les étapes, les formules mobilisées, le calcul, le résultat avec son unité).

RÈGLES IMPÉRATIVES
— Reste fidèle aux cours fournis.
— Le barème de chaque question doit refléter sa réelle difficulté.
— Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec ce format exact :
{
  "titre": "${titreSujet}",
  "duree": "2h",
  "exercices": [
    {
      "numero": 1,
      "titre": "Titre de l'exercice",
      "points": 7,
      "questions": [
        { "numero": "1.1", "enonce": "L'énoncé complet avec données chiffrées", "points": 2, "correction": "La démarche complète de résolution, étape par étape" }
      ]
    }
  ]
}

COURS À UTILISER :
${contenuCombine}`
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
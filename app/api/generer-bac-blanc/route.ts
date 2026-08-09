import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chapitres, niveauScolaire, userId } = await req.json()

    if (userId) {
      const limite = await verifierLimite(userId, 'generer-bac-blanc')
      if (!limite.autorise) {
        return NextResponse.json({ error: limite.message }, { status: 429 })
      }
    }

    if (!chapitres || chapitres.length === 0) {
      return NextResponse.json({ error: 'Au moins un chapitre requis' }, { status: 400 })
    }

    const contenuCombine = chapitres.map((c: any) => `--- ${c.chapitre} ---\n${c.contenu}`).join('\n\n')
    const titreSujet = niveauScolaire === 'Terminale' ? 'Bac Blanc - Physique-Chimie' : 'Contrôle Blanc - Physique-Chimie'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de physique-chimie qui conçoit les sujets de bac blanc de ton établissement depuis 15 ans — tes sujets sont réputés pour être un vrai galop d'essai fidèle au format et à l'esprit du bac, ni plus dur ni plus facile que l'épreuve réelle.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Le titre du sujet doit être exactement "${titreSujet}".

TA MISSION
Crée un sujet complet et cohérent à partir des cours fournis ci-dessous, dans le format officiel des épreuves françaises de physique-chimie.

STRUCTURE ATTENDUE
— Exercice 1 (7 points) : centré sur le premier chapitre fourni, avec 3-4 questions organisées en progression logique (une question d'introduction/restitution, puis des questions qui montent en complexité, la dernière question de l'exercice devant nécessiter de mobiliser plusieurs éléments des questions précédentes).
— Exercice 2 (7 points) : centré sur un autre chapitre si plusieurs sont fournis, même logique de progression.
— Exercice 3 (6 points) : question de synthèse ou transversale qui peut mobiliser plusieurs chapitres, pour tester la capacité à faire des liens (pas juste juxtaposer les notions).

EXIGENCES SUR LES QUESTIONS
Chaque question doit être formulée exactement comme dans un vrai sujet d'examen français : précise, sans ambiguïté sur ce qui est demandé, avec les données numériques nécessaires intégrées à l'énoncé (pas "sachant que X" vague, mais des valeurs chiffrées concrètes et réalistes). Évite les questions qui se répondent en une phrase sans réel raisonnement — chaque question doit valoir les points qui lui sont attribués.

EXIGENCES SUR LES CORRECTIONS
La correction de chaque question doit être une vraie démarche de résolution (pas juste le résultat final) : les étapes de raisonnement, les formules mobilisées, le calcul, et le résultat avec son unité. Un élève qui lit la correction doit comprendre COMMENT on arrive à la réponse, pas seulement QUELLE est la réponse.

RÈGLES IMPÉRATIVES
— Reste fidèle aux cours fournis : les questions doivent être répondables avec les connaissances de ces cours précis, pas avec des connaissances externes non enseignées.
— Le barème de chaque question doit refléter sa réelle difficulté (une question de restitution simple vaut moins qu'une question de raisonnement multi-étapes).
— Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX ni de symboles Unicode complexes.
— Le total des points par exercice doit correspondre exactement au barème indiqué (7, 7 et 6 points).

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
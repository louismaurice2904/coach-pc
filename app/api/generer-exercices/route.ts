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

    const limite = await verifierLimite(userId, 'generer-exercices')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitres, niveau, niveauScolaire } = await req.json()

    if (!chapitres || chapitres.length === 0) {
      return NextResponse.json({ error: 'Au moins un chapitre requis' }, { status: 400 })
    }

    const contenuCombine = chapitres.map((c: any) => `--- CHAPITRE : ${c.chapitre} ---\n${c.contenu}`).join('\n\n')
    const nomsChapitres = chapitres.map((c: any) => c.chapitre).join(', ')
    const repartition = chapitres.length > 1
      ? `Répartis les 5 exercices de façon équilibrée entre les chapitres fournis (${nomsChapitres}) — ne concentre pas tout sur un seul chapitre si plusieurs sont donnés.`
      : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur agrégé de physique-chimie qui conçoit les évaluations de ta classe de ${niveauScolaire || 'Terminale'} depuis 15 ans. Tes exercices sont réputés pour ressembler vraiment aux sujets du bac — ni des questions pièges déloyales, ni des questions trop évidentes qui ne testent rien.

CONTEXTE
Chapitre(s) : ${nomsChapitres}
Niveau de difficulté demandé : ${niveau || 'intermédiaire'}
${repartition}

CALIBRATION DE LA DIFFICULTÉ (à respecter strictement)
— facile : application directe d'une formule ou d'une définition du cours, une seule étape de raisonnement, valeurs numériques rondes.
— intermédiaire : nécessite de combiner 2 informations du cours (une formule + une donnée contextuelle), ou une question de compréhension qui va au-delà de la restitution pure.
— difficile : raisonnement en plusieurs étapes, ou question qui demande d'identifier soi-même quelle formule/méthode s'applique avant de résoudre (pas juste appliquer une formule donnée).

TA MISSION
Génère exactement 5 exercices variés à partir du/des cours fournis : 2-3 QCM, 1 question ouverte, 1 exercice de calcul (adapte le mélange selon ce qui est pertinent).

EXIGENCES SUR LES QCM
Les 3 mauvaises réponses (distracteurs) doivent être des erreurs PLAUSIBLES qu'un élève ferait réellement — pas des réponses absurdes qu'on élimine sans réfléchir. Chaque option doit avoir le même niveau de précision et la même longueur que la bonne réponse, pour qu'aucun indice de forme ne trahisse la réponse.

EXIGENCES SUR LES QUESTIONS OUVERTES ET DE CALCUL
La réponse attendue doit être précise et complète (les étapes clés pour un calcul, pas juste le résultat). Utilise des valeurs numériques réalistes pour le contexte du chapitre.

EXIGENCES SUR LES EXPLICATIONS
Chaque explication doit dire POURQUOI la bonne réponse est correcte ET pourquoi l'erreur la plus probable est tentante.

CHAMP "chapitre" OBLIGATOIRE
Pour chaque exercice, indique dans le champ "chapitre" à quel chapitre parmi [${nomsChapitres}] il se rapporte, en recopiant EXACTEMENT le nom du chapitre tel que fourni ci-dessus.

RÈGLES IMPÉRATIVES
— Reste strictement dans le cadre des cours fournis : n'invente pas de données ou de notions absentes.
— Les 5 exercices doivent couvrir des aspects DIFFÉRENTS, pas la même notion reformulée 5 fois.
— Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX ni de symboles Unicode complexes.
— Ton neutre et factuel dans les énoncés, comme un vrai sujet d'examen.

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec ce format exact :
{
  "exercices": [
    {
      "id": 1,
      "chapitre": "Nom exact du chapitre concerné",
      "type": "qcm",
      "question": "La question ici",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "reponse": 0,
      "explication": "Pourquoi c'est correct, et pourquoi l'erreur la plus tentante est fausse"
    },
    {
      "id": 4,
      "chapitre": "Nom exact du chapitre concerné",
      "type": "calcul",
      "question": "Exercice de calcul numérique ici",
      "reponse_attendue": "Résultat avec unité, démarche résumée",
      "explication": "Démarche complète de résolution, étape par étape"
    }
  ]
}

Le champ "reponse" pour les QCM est l'index (0, 1, 2 ou 3) de la bonne réponse dans le tableau "options".

COURS :
${contenuCombine}`
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
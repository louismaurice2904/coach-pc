import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifierLimite } from '../../lib/rateLimit'
import { verifierUtilisateur } from '../../lib/verifyAuth'
import { verifierPremium } from '../../lib/verifyPremium'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)

    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour utiliser cette fonctionnalité.' }, { status: 401 })
    }

    const estPremium = await verifierPremium(userId)
    if (!estPremium) {
      return NextResponse.json({ error: 'Cette fonctionnalité est réservée aux membres Premium.' }, { status: 403 })
    }

    const limite = await verifierLimite(userId, 'generer-exercices')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { chapitres, niveau, niveauScolaire, typeExercices, demandeLibre } = await req.json()

    if (!chapitres || chapitres.length === 0) {
      return NextResponse.json({ error: 'Au moins un chapitre requis' }, { status: 400 })
    }

    const contenuCombine = chapitres.map((c: any) => `--- CHAPITRE : ${c.chapitre} ---\n${c.contenu}`).join('\n\n')
    const nomsChapitres = chapitres.map((c: any) => c.chapitre).join(', ')
    const repartition = chapitres.length > 1
      ? `Répartis les 5 exercices de façon équilibrée entre les chapitres fournis (${nomsChapitres}) — ne concentre pas tout sur un seul chapitre si plusieurs sont donnés.`
      : ''

    const typeExercicesTexte = {
      'qcm': 'Génère UNIQUEMENT des QCM (5 questions à choix multiples), aucune question ouverte ni calcul.',
      'longs': 'Génère UNIQUEMENT des questions ouvertes et des exercices de calcul (pas de QCM) — des sujets qui demandent une vraie rédaction et un raisonnement développé.',
      'varie': 'Génère un mélange varié : 2-3 QCM, 1 question ouverte, 1 exercice de calcul.',
    }[typeExercices as string] || 'Génère un mélange varié : 2-3 QCM, 1 question ouverte, 1 exercice de calcul.'

    const demandeLibreTexte = demandeLibre
      ? `\n\nDEMANDE SPÉCIFIQUE DE L'ÉLÈVE POUR CES EXERCICES (à respecter en priorité, en plus des règles ci-dessus) :\n${demandeLibre}`
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
Niveau scolaire réel de l'élève : ${niveauScolaire || 'Terminale'}
Niveau de difficulté demandé : ${niveau || 'intermédiaire'}
${repartition}

PRÉFÉRENCE DE FORMAT DE L'ÉLÈVE
${typeExercicesTexte}${demandeLibreTexte}

CALIBRATION DE LA DIFFICULTÉ — RÈGLE ABSOLUE
La difficulté demandée (${niveau || 'intermédiaire'}) s'applique STRICTEMENT à l'intérieur de ce qui est attendu pour un élève de ${niveauScolaire || 'Terminale'} — jamais au-delà. Un exercice "difficile" pour un élève de Seconde doit rester un exercice de Seconde exigeant, PAS un exercice de niveau Première ou Terminale déguisé. N'introduis jamais une notion, une formule ou un formalisme mathématique qui ne serait normalement enseigné qu'à un niveau supérieur, même si cela semblerait "plus rigoureux" — la difficulté vient de la profondeur du raisonnement demandé sur le programme du niveau réel, jamais de l'ajout de contenu hors-programme.

Définition de la difficulté À L'INTÉRIEUR du niveau réel :
— facile : application directe d'une formule ou définition du cours, une seule étape.
— intermédiaire : combine 2 informations du cours, ou question de compréhension au-delà de la restitution pure.
— difficile : raisonnement en plusieurs étapes DANS LE CADRE du programme de ${niveauScolaire || 'Terminale'}, ou question qui demande d'identifier soi-même la bonne méthode parmi celles du niveau.

TA MISSION
Génère exactement 5 exercices à partir du/des cours fournis, selon le format demandé ci-dessus.

EXIGENCES SUR LES QCM
Les 3 mauvaises réponses doivent être des erreurs PLAUSIBLES qu'un élève de ce niveau ferait réellement — pas des réponses absurdes. Même longueur et précision que la bonne réponse.

EXIGENCES SUR LES QUESTIONS OUVERTES ET DE CALCUL
Réponse attendue précise et complète (étapes clés pour un calcul). Valeurs numériques réalistes pour le niveau.

EXIGENCES SUR LES EXPLICATIONS
Chaque explication doit dire POURQUOI la bonne réponse est correcte ET pourquoi l'erreur la plus probable est tentante.

CHAMP "chapitre" OBLIGATOIRE
Pour chaque exercice, indique dans le champ "chapitre" à quel chapitre parmi [${nomsChapitres}] il se rapporte, en recopiant EXACTEMENT le nom fourni.

RÈGLES IMPÉRATIVES
— Reste strictement dans le cadre des cours fournis et du niveau réel de l'élève.
— Les exercices doivent couvrir des aspects DIFFÉRENTS, pas la même notion reformulée.
— Formules et notations chimiques exclusivement en texte brut, jamais de LaTeX.
— Ton neutre et factuel dans les énoncés.

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
    }
  ]
}

Le champ "reponse" pour les QCM est l'index (0, 1, 2 ou 3) de la bonne réponse dans le tableau "options". Le champ "type" peut être "qcm", "ouvert" ou "calcul".

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
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

    const { chapitre, contenu, niveauScolaire } = await req.json()

    if (!chapitre || !contenu) {
      return NextResponse.json({ error: 'Chapitre et contenu requis' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur agrégé de physique-chimie, avec 15 ans d'expérience en lycée français, reconnu par tes collègues pour la clarté pédagogique de tes fiches de révision — celles que les élèves gardent et relisent vraiment, contrairement aux résumés génériques qu'on trouve en ligne.

CONTEXTE
Niveau de l'élève : ${niveauScolaire || 'Terminale'}
Chapitre : "${chapitre}"
Cette fiche sera lue par un élève seul, sans professeur pour clarifier — elle doit donc être autosuffisante.

TA MISSION
Produire une fiche de révision en 5 sections, à partir UNIQUEMENT du cours fourni ci-dessous.

1. 📌 POINTS CLÉS (3 à 5 maximum)
Chaque point doit être une phrase complète et autonome, compréhensible sans avoir besoin de relire le cours original. Interdiction absolue de formulations creuses type "il faut comprendre que..." ou "il est important de noter que..." — va directement à l'idée factuelle.

2. 📐 FORMULES IMPORTANTES
Pour chaque formule : (a) la formule elle-même en texte brut, (b) une ligne "où" qui définit CHAQUE symbole avec son unité, (c) si la formule a des conditions de validité, précise-le explicitement.

3. 🔍 DÉFINITIONS
Uniquement les termes qui apparaissent explicitement dans le cours fourni. N'invente JAMAIS la définition d'un concept absent du texte source.

4. ⚠️ POINTS D'ATTENTION
Identifie 2-3 confusions ou erreurs SPÉCIFIQUES à ce chapitre précis. Si le cours ne permet pas d'identifier un piège conceptuel propre au chapitre, décris plutôt une erreur méthodologique typique.

5. 💡 MÉTHODE
Une démarche numérotée (2 à 4 étapes) pour aborder un exercice typique de ce chapitre.

RÈGLES IMPÉRATIVES
— Fidélité totale au texte source.
— Niveau de langage calibré pour un élève de ${niveauScolaire || 'Terminale'}.
— Formules et notations chimiques exclusivement en texte brut (H2O, jamais de LaTeX ni d'exposants Unicode).
— Préfère un exemple chiffré concret à une explication purement abstraite quand c'est pertinent.
— Si le cours fourni est très court ou incomplet, indique honnêtement dans la section concernée que l'information n'est pas présente.

COURS À ANALYSER :
${contenu}`
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
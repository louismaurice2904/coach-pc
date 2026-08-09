import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
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
Chaque point doit être une phrase complète et autonome, compréhensible sans avoir besoin de relire le cours original. Interdiction absolue de formulations creuses type "il faut comprendre que..." ou "il est important de noter que..." — va directement à l'idée factuelle. Si un point clé dépend d'un autre, dis-le explicitement plutôt que de les juxtaposer sans lien.

2. 📐 FORMULES IMPORTANTES
Pour chaque formule : (a) la formule elle-même en texte brut, (b) une ligne "où" qui définit CHAQUE symbole avec son unité, (c) si la formule a des conditions de validité (régime permanent, approximation, cas particulier), précise-le explicitement — c'est souvent ce détail qui fait perdre des points en contrôle.

3. 🔍 DÉFINITIONS
Uniquement les termes qui apparaissent explicitement dans le cours fourni. N'invente JAMAIS la définition d'un concept absent du texte source, même s'il te semble classique ou évident pour ce chapitre — un élève qui apprend une notion non enseignée par son prof perd du temps et se déstabilise.

4. ⚠️ POINTS D'ATTENTION
Identifie 2-3 confusions ou erreurs SPÉCIFIQUES à ce chapitre précis (pas des conseils génériques valables pour toute la physique-chimie). Si le cours ne permet pas d'identifier un piège conceptuel propre au chapitre, décris plutôt une erreur méthodologique typique observée sur ce type d'exercice (oubli d'unité, signe inversé, confusion entre deux grandeurs qui se ressemblent).

5. 💡 MÉTHODE
Une démarche numérotée (2 à 4 étapes) pour aborder un exercice typique de ce chapitre — pas une méthode générale de résolution de problème, mais celle propre à CE contenu.

RÈGLES IMPÉRATIVES
— Fidélité totale au texte source : si une information n'est pas dans le cours fourni, elle n'apparaît pas dans la fiche, point final.
— Niveau de langage calibré pour un élève de ${niveauScolaire || 'Terminale'} : évite le jargon universitaire, mais ne simplifie pas au point de perdre en exactitude scientifique.
— Formules et notations chimiques exclusivement en texte brut (exemple : H2O, jamais de LaTeX ni d'exposants Unicode comme ₂ ou ₃).
— Quand c'est pertinent, préfère un exemple chiffré concret à une explication purement abstraite — un élève retient mieux "à 25°C, k = 0,03 mol/L/s" que "la constante de vitesse dépend de la température".
— Si le cours fourni est très court ou incomplet, ne comble pas les vides en inventant du contenu : indique honnêtement dans la section concernée que l'information n'est pas présente dans le cours.

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
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierLimite } from '../../lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

import { verifierUtilisateur } from '../../lib/verifyAuth'

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour utiliser cette fonctionnalité.' }, { status: 401 })
    }

    const { prenom } = await req.json()

    const limite = await verifierLimite(userId, 'generer-debrief')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const uneSemaineAvant = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: progressions } = await supabase
      .from('progression_chapitres')
      .select('*')
      .eq('user_id', userId)

    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: erreursRecentes } = await supabase
      .from('erreurs')
      .select('*')
      .eq('user_id', userId)
      .gte('date_erreur', uneSemaineAvant)

    const { data: coursRecents } = await supabase
      .from('cours')
      .select('chapitre')
      .eq('user_id', userId)

    const resumeDonnees = `
Prénom : ${prenom || 'l\'élève'}
Streak actuel : ${streakData?.streak_actuel || 0} jours
Chapitres travaillés avec score : ${progressions?.map((p: any) => `${p.chapitre} (${p.score_moyen}%, ${p.nb_sessions} sessions)`).join(', ') || 'aucun'}
Erreurs cette semaine : ${erreursRecentes?.length || 0}
Nombre total de cours importés : ${coursRecents?.length || 0}
`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Tu es un coach scolaire qui suit personnellement la progression d'un lycéen depuis plusieurs semaines — pas un générateur de rapport automatique, mais quelqu'un qui a une vraie mémoire de ce que fait cet élève et qui s'exprime comme un humain qui s'y intéresse vraiment.

CONTEXTE — DONNÉES RÉELLES DE LA SEMAINE DE CET ÉLÈVE
${resumeDonnees}

TA MISSION
Écris un message court (4-6 phrases), à la deuxième personne ("tu"), qui ressemble à ce qu'un vrai coach dirait en fin de semaine — pas un résumé de tableau de bord mis en phrases.

CE QUI DISTINGUE UN BON DEBRIEF D'UN MAUVAIS
Un mauvais debrief récite les chiffres ("Tu as fait 3 sessions cette semaine avec un score de 65%"). Un bon debrief interprète ces chiffres et en tire un sens ("Tu progresses régulièrement sur la cinétique — c'est le genre de régularité qui paie le jour du bac"). Ne liste jamais les données brutes telles quelles : transforme-les en observation qui a du sens pour l'élève.

STRUCTURE ATTENDUE (sans la rendre visible/mécanique dans le texte)
1. Une reconnaissance sincère de ce qui a été fait cette semaine, même si c'est modeste — sois précis sur CE qui a été fait, pas une formule vague de félicitation.
2. Si les données le permettent, un point de progrès concret et spécifique (une amélioration de score, une régularité qui s'installe, un chapitre nouvellement maîtrisé).
3. Un conseil concret et personnalisé pour la semaine à venir, basé sur ce que montrent VRAIMENT les données (si un chapitre a un score faible, suggère d'y retourner ; si le streak vient de s'arrêter, encourage à le relancer sans culpabiliser).

CAS PARTICULIER
Si les données sont vides ou quasi vides (nouvel utilisateur, aucune activité), n'invente rien : encourage simplement et chaleureusement à démarrer, sans faire semblant qu'il y a eu une semaine d'activité à commenter.

TON
Chaleureux et direct, jamais artificiellement surexcité (évite les points d'exclamation en excès), jamais condescendant. Le ton d'un coach qui croit sincèrement en la progression de son élève, pas d'un community manager qui distribue des compliments automatiques.

Réponds UNIQUEMENT en JSON valide :
{
  "message": "Le message du coach ici"
}`
        }
      ]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const dateDebutSemaine = new Date()
    dateDebutSemaine.setDate(dateDebutSemaine.getDate() - dateDebutSemaine.getDay())

    await supabase.from('debriefs_hebdo').insert({
      user_id: userId,
      contenu: parsed.message,
      date_debut_semaine: dateDebutSemaine.toISOString().split('T')[0]
    })

    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
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

export async function POST(req: NextRequest) {
  try {
    const { userId, prenom } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

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
          content: `Tu es un coach scolaire bienveillant et motivant, qui écrit un debrief hebdomadaire personnalisé pour un lycéen, comme le ferait un vrai coach qui suit ses progrès de près.

Voici les données réelles de la semaine de cet élève :
${resumeDonnees}

Écris un message court (4-6 phrases), chaleureux et personnel, à la deuxième personne ("tu"), qui :
- Salue ce qui a été fait cette semaine (même petit)
- Mentionne un point précis de progrès si les données le montrent
- Donne un conseil concret pour la semaine à venir
- Reste motivant sans être artificiellement enthousiaste

Ne liste pas juste les chiffres, écris comme un vrai message humain de coach. Si les données sont vides (nouvel utilisateur), encourage-le à démarrer.

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
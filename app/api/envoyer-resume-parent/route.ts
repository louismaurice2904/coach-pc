import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { data: profilsAvecPartage } = await supabase
      .from('profils')
      .select('*')
      .eq('partage_parent_actif', true)
      .not('email_parent', 'is', null)

    if (!profilsAvecPartage || profilsAvecPartage.length === 0) {
      return NextResponse.json({ envoyes: 0 })
    }

    let envoyes = 0

    for (const profil of profilsAvecPartage) {
      const uneSemaineAvant = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: progressions } = await supabase
        .from('progression_chapitres')
        .select('*')
        .eq('user_id', profil.user_id)

      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', profil.user_id)
        .single()

      const { data: coursRecents } = await supabase
        .from('cours')
        .select('chapitre')
        .eq('user_id', profil.user_id)

      const resumeDonnees = `
Prénom de l'élève : ${profil.prenom || 'votre enfant'}
Streak actuel : ${streakData?.streak_actuel || 0} jours consécutifs
Chapitres travaillés : ${progressions?.map((p: any) => `${p.chapitre} (${p.score_moyen}%)`).join(', ') || 'aucun cette semaine'}
Nombre total de cours importés : ${coursRecents?.length || 0}
`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `Tu écris un résumé hebdomadaire à destination d'un PARENT (pas de l'élève), sur l'activité de son enfant sur Novalys, plateforme de révision de physique-chimie.

DONNÉES RÉELLES DE LA SEMAINE
${resumeDonnees}

TA MISSION
Écris un message court (4-5 phrases), factuel et rassurant, à destination du parent. Ne dramatise jamais un score faible, présente les choses avec bienveillance mais sans mentir sur la réalité. Si les données sont vides, indique simplement que l'élève n'a pas encore beaucoup utilisé la plateforme cette semaine, sans culpabiliser qui que ce soit.

TON
Professionnel et chaleureux, comme un enseignant qui donne des nouvelles constructives, jamais alarmiste.

Réponds UNIQUEMENT en JSON valide :
{
  "resume": "Le résumé ici"
}`
          }
        ]
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      const clean = raw.replace(/```json|```/g, '').trim()
      const { resume } = JSON.parse(clean)

      await resend.emails.send({
        from: `Novalys <noreply@novalys-app.fr>`,
        to: profil.email_parent,
        subject: `Résumé hebdomadaire — ${profil.prenom || 'votre enfant'} sur Novalys`,
        html: `
          <div style="font-family: -apple-system, sans-serif; background-color: #070b18; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #0c1120; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.08);">
              <p style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0 0 24px;">Nova<span style="color: #38bdf8;">lys</span></p>
              <h1 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 16px;">Résumé de la semaine</h1>
              <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.7;">${resume}</p>
              <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 28px;">
                Vous recevez cet email car votre enfant a activé le partage depuis son compte Novalys. Il peut le désactiver à tout moment.
              </p>
            </div>
          </div>
        `
      })

      envoyes++
    }

    return NextResponse.json({ envoyes })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
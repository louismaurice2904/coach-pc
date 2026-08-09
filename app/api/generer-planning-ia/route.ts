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
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const limite = await verifierLimite(userId, 'generer-planning-ia')
    if (!limite.autorise) {
      return NextResponse.json({ error: limite.message }, { status: 429 })
    }

    const { data: profil } = await supabase.from('profils').select('*').eq('user_id', userId).single()
    const { data: cours } = await supabase.from('cours').select('chapitre').eq('user_id', userId)
    const { data: progressions } = await supabase.from('progression_chapitres').select('*').eq('user_id', userId)
    const { data: controlesAVenir } = await supabase
      .from('controles')
      .select('*')
      .eq('user_id', userId)
      .gte('date_controle', new Date().toISOString().split('T')[0])
      .order('date_controle', { ascending: true })

    if (!cours || cours.length === 0) {
      return NextResponse.json({ error: 'Importe au moins un cours avant de générer ton planning' }, { status: 400 })
    }

    const chapitresInfo = cours.map((c: any) => {
      const prog = progressions?.find((p: any) => p.chapitre === c.chapitre)
      const controle = controlesAVenir?.find((ct: any) => ct.chapitre.includes(c.chapitre))
      const joursAvantControle = controle
        ? Math.ceil((new Date(controle.date_controle).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
      return {
        chapitre: c.chapitre,
        score: prog?.score_moyen ?? null,
        sessions: prog?.nb_sessions ?? 0,
        joursAvantControle
      }
    })

    const resumeChapitres = chapitresInfo.map((c: any) =>
      `- ${c.chapitre} : score ${c.score !== null ? c.score + '%' : 'non travaillé'}, ${c.sessions} session(s)${c.joursAvantControle !== null ? `, CONTRÔLE DANS ${c.joursAvantControle} JOURS` : ''}`
    ).join('\n')

    const tempsSemaine = profil?.temps_semaine || 5

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `Tu es un coach scolaire expert en planification de révisions, qui conçoit des plannings hebdomadaires personnalisés pour des lycéens en physique-chimie. Ton objectif : que l'élève n'ait jamais à se demander "quoi faire aujourd'hui" — chaque case du planning doit être une décision déjà prise à sa place.

DONNÉES DE L'ÉLÈVE
Niveau : ${profil?.niveau_scolaire || 'Terminale'}
Objectif de note : ${profil?.objectif_note || 14}/20
Temps disponible cette semaine : ${tempsSemaine} heures

ÉTAT DES CHAPITRES (score de progression, nombre de sessions déjà faites, urgence de contrôle si applicable) :
${resumeChapitres}

PRINCIPES DE PLANIFICATION (à respecter strictement, dans cet ordre de priorité)
1. URGENCE DES CONTRÔLES D'ABORD : un chapitre avec un contrôle dans moins de 7 jours doit dominer le planning de la semaine, proportionnellement à cette urgence — plus le contrôle est proche, plus ce chapitre doit apparaître souvent.
2. PRIORISATION PAR FAIBLESSE : parmi les chapitres sans contrôle imminent, donne plus de temps à ceux avec un score bas ou non travaillés qu'à ceux déjà maîtrisés (score supérieur à 80%). Ne planifie jamais de session sur un chapitre à plus de 90% sauf s'il a un contrôle proche (répétition espacée légère uniquement).
3. VARIÉTÉ DES ACTIVITÉS : répartis les types de tâches parmi : "fiche" (relire/générer la fiche de révision), "exercices-facile", "exercices-difficile", "flashcards" (mémorisation rapide), "feynman" (expliquer une notion avec ses mots). N'enchaîne jamais le même type d'activité sur tout un chapitre le même jour — alterne pour éviter la monotonie.
4. RÉPÉTITION ESPACÉE : si un chapitre est travaillé un jour donné, ne le fais pas disparaître ensuite — prévois un retour bref (flashcards ou exercice rapide) 2-3 jours plus tard pour ancrer la mémorisation, plutôt que de le traiter une seule fois et de passer au suivant.
5. SESSIONS RÉALISTES : chaque session doit durer entre 20 et 45 minutes. Ne planifie jamais une session de plus de 45 minutes sur un seul chapitre — découpe plutôt en deux sessions à des moments différents.
6. RESPECT DU TEMPS DISPONIBLE : le total des sessions sur la semaine ne doit jamais dépasser ${tempsSemaine} heures. Laisse volontairement une petite marge (10-15% du temps) non planifiée pour l'imprévu — ne remplis jamais 100% du temps déclaré.
7. COUVERTURE : sur une semaine complète, essaie de faire apparaître chaque chapitre importé au moins une fois, sauf si le temps disponible est vraiment insuffisant pour tous les couvrir — dans ce cas, priorise strictement selon les règles 1 et 2 plutôt que de diluer le temps sur tous les chapitres.

FORMAT DE CHAQUE TÂCHE
Chaque tâche doit avoir un intitulé précis et actionnable (exemple : "Exercices difficiles — Cinétique chimique" et non "Réviser la chimie"), une durée en minutes, et le type d'activité qui détermine vers quel outil elle renvoie.

RÈGLES IMPÉRATIVES
— Répartis les tâches sur 5 à 7 jours selon ce qui est réaliste pour ${tempsSemaine}h disponibles (ne force pas 7 jours si le temps est faible : mieux vaut 4 jours bien remplis que 7 jours avec des micro-sessions inutiles).
— N'invente pas de chapitre : utilise exclusivement les chapitres listés ci-dessus.
— Si un jour n'a raisonnablement rien à y mettre compte tenu du temps total, ne force pas une tâche artificielle ce jour-là.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec ce format exact :
{
  "planning": [
    {
      "jour": "Lundi",
      "taches": [
        { "chapitre": "Cinétique chimique", "type": "exercices-difficile", "titre": "Exercices difficiles — Cinétique chimique", "duree_minutes": 30 }
      ]
    }
  ],
  "note_coach": "Une phrase courte expliquant la logique de priorisation de cette semaine, écrite comme un vrai coach s'adresserait à l'élève"
}`
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
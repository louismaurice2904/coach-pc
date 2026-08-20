import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifierUtilisateur } from '../../lib/verifyAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLES_UTILISATEUR = [
  'cours', 'fiches_generees', 'streaks', 'progression_chapitres',
  'erreurs', 'activite_quotidienne', 'controles', 'profils',
  'flashcards', 'sessions_feynman', 'simulations_examen',
  'debriefs_hebdo', 'messages_chat', 'evaluations', 'appels_ia'
]

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour supprimer ton compte.' }, { status: 401 })
    }

    for (const table of TABLES_UTILISATEUR) {
      await supabaseAdmin.from(table).delete().eq('user_id', userId)
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Erreur suppression compte auth:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression du compte.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
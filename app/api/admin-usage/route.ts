import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifierUtilisateur } from '../../lib/verifyAuth'
import { estAdmin } from '../../lib/verifyAdmin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('authorization')!.replace('Bearer ', '')
    )

    if (!estAdmin(user?.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const trenteJoursAvant = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: appels } = await supabase
      .from('appels_ia')
      .select('user_id')
      .gte('horodatage', trenteJoursAvant)

    const comptage: Record<string, number> = {}
    appels?.forEach((a: any) => {
      comptage[a.user_id] = (comptage[a.user_id] || 0) + 1
    })

    const userIds = Object.keys(comptage)
    const { data: profils } = await supabase
      .from('profils')
      .select('user_id, prenom, suspendu')
      .in('user_id', userIds)

    const classement = userIds
      .map(id => {
        const profil = profils?.find((p: any) => p.user_id === id)
        return {
          user_id: id,
          prenom: profil?.prenom || 'Inconnu',
          suspendu: profil?.suspendu || false,
          nb_appels: comptage[id]
        }
      })
      .sort((a, b) => b.nb_appels - a.nb_appels)

    return NextResponse.json({ classement })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
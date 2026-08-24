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

    const maintenant = new Date().toISOString()
    const trenteJoursAvant = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const septJoursAvant = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: profils } = await supabase.from('profils').select('*')
    const { data: coursData } = await supabase.from('cours').select('id')
    const { data: appelsRecents } = await supabase.from('appels_ia').select('route, horodatage').gte('horodatage', trenteJoursAvant)
    const { data: messagesNonLus } = await supabase.from('messages').select('id').eq('lu', false)

    const totalInscrits = profils?.filter((p: any) => p.prenom).length || 0
    const abonnesPaye = profils?.filter((p: any) => p.abonnement_paye).length || 0
    const essaisActifs = profils?.filter((p: any) => p.essai_premium_fin && new Date(p.essai_premium_fin) > new Date() && !p.abonnement_paye).length || 0
    const comptesSuspendus = profils?.filter((p: any) => p.suspendu).length || 0

    const repartitionNiveau: Record<string, number> = {}
    profils?.forEach((p: any) => {
      if (p.classe) repartitionNiveau[p.classe] = (repartitionNiveau[p.classe] || 0) + 1
    })

    const repartitionRoutes: Record<string, number> = {}
    appelsRecents?.forEach((a: any) => {
      repartitionRoutes[a.route] = (repartitionRoutes[a.route] || 0) + 1
    })
    const topRoutes = Object.entries(repartitionRoutes)
      .map(([route, count]) => ({ route, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 6)

    const appelsSemaine = appelsRecents?.filter((a: any) => a.horodatage >= septJoursAvant).length || 0

    return NextResponse.json({
      totalInscrits,
      abonnesPaye,
      essaisActifs,
      comptesSuspendus,
      totalCours: coursData?.length || 0,
      appelsIA30j: appelsRecents?.length || 0,
      appelsIA7j: appelsSemaine,
      messagesNonLus: messagesNonLus?.length || 0,
      repartitionNiveau,
      topRoutes,
      revenuMensuelEstime: abonnesPaye * 9.99
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
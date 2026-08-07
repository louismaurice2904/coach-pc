import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LIMITE_PAR_HEURE = 20

export async function verifierLimite(userId: string, route: string): Promise<{ autorise: boolean; message?: string }> {
  const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('appels_ia')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('route', route)
    .gte('horodatage', uneHeureAvant)

  if (count !== null && count >= LIMITE_PAR_HEURE) {
    return { autorise: false, message: `Limite atteinte : maximum ${LIMITE_PAR_HEURE} générations par heure. Réessaie plus tard.` }
  }

  await supabase.from('appels_ia').insert({ user_id: userId, route, horodatage: new Date().toISOString() })
  return { autorise: true }
}
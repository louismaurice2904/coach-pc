import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITE_PAR_HEURE = 20
const LIMITE_CHAT_PAR_JOUR = 30

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

export async function verifierLimiteQuotidienne(userId: string, route: string): Promise<{ autorise: boolean; message?: string }> {
  const debutJournee = new Date()
  debutJournee.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('appels_ia')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('route', route)
    .gte('horodatage', debutJournee.toISOString())

  if (count !== null && count >= LIMITE_CHAT_PAR_JOUR) {
    return { autorise: false, message: `Tu as atteint la limite de ${LIMITE_CHAT_PAR_JOUR} messages par jour sur le chat. Reviens demain !` }
  }

  await supabase.from('appels_ia').insert({ user_id: userId, route, horodatage: new Date().toISOString() })
  return { autorise: true }
}
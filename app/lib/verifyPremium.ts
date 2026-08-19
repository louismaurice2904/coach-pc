import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function verifierPremium(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profils')
    .select('premium')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false
  return data.premium === true
}
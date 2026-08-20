import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const maintenant = new Date().toISOString()

  const { data: expires } = await supabase
    .from('profils')
    .update({ premium: false })
    .lt('essai_premium_fin', maintenant)
    .eq('abonnement_paye', false)
    .eq('premium', true)
    .select()

  return NextResponse.json({ desactives: expires?.length || 0 })
}
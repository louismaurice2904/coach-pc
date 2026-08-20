import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifierUtilisateur } from '../../lib/verifyAuth'
import { estAdmin } from '../../lib/verifyAdmin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
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

    const { targetUserId, suspendre } = await req.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId requis' }, { status: 400 })
    }

    await supabase.from('profils').update({ suspendu: suspendre }).eq('user_id', targetUserId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
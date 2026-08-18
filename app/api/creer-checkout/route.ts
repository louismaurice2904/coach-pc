import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { verifierUtilisateur } from '../../lib/verifyAuth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const userId = await verifierUtilisateur(req)
    if (!userId) {
      return NextResponse.json({ error: 'Tu dois être connecté pour effectuer un paiement.' }, { status: 401 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${req.headers.get('origin')}/profil?paiement=succes`,
      cancel_url: `${req.headers.get('origin')}/profil?paiement=annule`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Erreur Stripe:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
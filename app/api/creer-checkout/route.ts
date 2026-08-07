import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId et email requis' }, { status: 400 })
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
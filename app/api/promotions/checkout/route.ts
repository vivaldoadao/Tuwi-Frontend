import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPromotionCheckoutSession } from '@/lib/stripe-promotions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'braider') {
      return NextResponse.json({ error: 'Only braiders can purchase promotions' }, { status: 403 })
    }

    const body = await request.json()
    const { promotion_data } = body

    if (!promotion_data) {
      return NextResponse.json({ error: 'Promotion data is required' }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ['title', 'type', 'price', 'start_date', 'end_date']
    for (const field of requiredFields) {
      if (!promotion_data[field]) {
        return NextResponse.json({ error: `Field ${field} is required` }, { status: 400 })
      }
    }

    if (promotion_data.price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    // URLs de sucesso e cancelamento
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/braider-dashboard/promotions/success`
    const cancelUrl = `${baseUrl}/braider-dashboard/promotions`

    // Criar sessão de checkout do Stripe
    const checkoutSession = await createPromotionCheckoutSession(
      promotion_data,
      session.user.id,
      session.user.email || '',
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.sessionId
    })

  } catch (error) {
    console.error('Error creating promotion checkout:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}

// Endpoint para verificar status da sessão
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { getCheckoutSession } = await import('@/lib/stripe-promotions')
    const checkoutSession = await getCheckoutSession(sessionId)

    return NextResponse.json({
      success: true,
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        amount_total: checkoutSession.amount_total,
        metadata: checkoutSession.metadata
      }
    })

  } catch (error) {
    console.error('Error fetching checkout session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch session status',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}
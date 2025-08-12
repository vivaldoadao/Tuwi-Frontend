import { NextRequest, NextResponse } from 'next/server'
import { handlePromotionWebhook } from '@/lib/stripe-promotions'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Get raw body
    const rawBody = await request.text()

    // Handle webhook
    const result = await handlePromotionWebhook(
      {} as any, // O evento será construído dentro da função
      endpointSecret,
      rawBody,
      signature
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 400 }
    )
  }
}

// Endpoint interno para processar ações de webhook
export async function PUT(request: NextRequest) {
  try {
    // Verificar token interno
    const authHeader = request.headers.get('Authorization')
    const expectedToken = process.env.INTERNAL_API_KEY
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, user_id, promotion_data } = body

    if (action === 'create_paid_promotion') {
      // Criar promoção no banco após pagamento confirmado
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get() { return undefined },
            set() {},
            remove() {}
          }
        }
      )

      const { data: promotion, error } = await supabase
        .from('promotions')
        .insert({
          user_id,
          type: promotion_data.type,
          title: promotion_data.title,
          description: promotion_data.description,
          start_date: promotion_data.start_date,
          end_date: promotion_data.end_date,
          content_data: promotion_data.content_data,
          price: promotion_data.price,
          status: 'pending', // Aguardando aprovação admin
          metadata: promotion_data.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating paid promotion:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      // Log da transação
      await supabase
        .from('promotion_transactions')
        .insert({
          promotion_id: promotion.id,
          user_id,
          type: 'purchase',
          amount: promotion_data.price,
          currency: 'EUR',
          status: 'completed',
          payment_method: 'stripe',
          stripe_session_id: promotion_data.metadata?.stripe_session_id,
          created_at: new Date().toISOString()
        })

      // Criar notificação para admin
      await supabase
        .from('promotion_notifications')
        .insert({
          promotion_id: promotion.id,
          user_id,
          type: 'admin_approval_required',
          title: 'Nova Promoção Paga Aguardando Aprovação',
          message: `A trancista ${promotion_data.title} comprou uma promoção do tipo ${promotion_data.type} e aguarda aprovação.`,
          data: {
            promotion_type: promotion_data.type,
            amount_paid: promotion_data.price,
            stripe_session_id: promotion_data.metadata?.stripe_session_id
          },
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        promotion_id: promotion.id,
        message: 'Paid promotion created successfully'
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Internal webhook processing error:', error)
    return NextResponse.json(
      { 
        error: 'Internal processing failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}
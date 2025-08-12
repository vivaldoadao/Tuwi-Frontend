import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * API para cancelar assinatura de promoção
 * 
 * POST /api/promotions/subscriptions/[id]/cancel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subscriptionId } = resolvedParams

    if (!subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing subscription ID'
      }, { status: 400 })
    }

    // Criar cliente Supabase com service role para admin operations
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

    console.log('🔄 Processing subscription cancellation:', { subscriptionId, userId: session.user.id })

    // 1. Buscar assinatura local
    const { data: subscription, error: subscriptionError } = await supabase
      .from('promotion_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id) // Garantir que o usuário só pode cancelar suas próprias assinaturas
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found or access denied'
      }, { status: 404 })
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: 'Subscription is already cancelled'
      }, { status: 400 })
    }

    // 2. Cancelar no Stripe (no final do período)
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        })

        console.log('✅ Stripe subscription marked for cancellation:', subscription.stripe_subscription_id)
      } catch (stripeError) {
        console.error('⚠️ Failed to cancel Stripe subscription:', stripeError)
        // Continuar mesmo se falhar no Stripe - atualizar localmente
      }
    }

    // 3. Atualizar status local
    const { error: updateError } = await supabase
      .from('promotion_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('❌ Error updating subscription status:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update subscription status'
      }, { status: 500 })
    }

    // 4. Registrar evento de cancelamento
    await supabase
      .from('promotion_subscription_executions')
      .insert({
        subscription_id: subscriptionId,
        execution_type: 'cancellation',
        status: 'completed',
        execution_details: {
          cancelled_by_user: true,
          cancellation_date: new Date().toISOString(),
          will_end_at: subscription.current_period_end
        }
      })

    // TODO: Enviar notificação de cancelamento
    console.log('📧 Should notify user about subscription cancellation:', session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso. Permanecerá ativa até o final do período atual.',
      subscription: {
        id: subscription.id,
        cancel_at_period_end: true,
        current_period_end: subscription.current_period_end
      }
    })

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
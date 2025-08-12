import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { promotionComboService } from '@/lib/promotion-combos'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_COMBOS!

/**
 * Webhook do Stripe para processar eventos de combos e assinaturas
 * 
 * POST /api/promotions/combos/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🔔 Stripe webhook event received:', event.type)

    // Criar cliente Supabase
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

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(supabase, event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`🔕 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({
      error: 'Webhook handler failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Processar checkout completado (pagamento único)
 */
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  try {
    console.log('💰 Processing checkout completed:', session.id)

    const transactionId = session.metadata?.transaction_id
    const userId = session.metadata?.user_id
    const comboId = session.metadata?.combo_id

    if (!transactionId || !userId || !comboId) {
      console.error('❌ Missing metadata in checkout session:', session.metadata)
      return
    }

    // Atualizar transação
    const { error: updateError } = await supabase
      .from('promotion_transactions')
      .update({
        status: 'completed',
        stripe_status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('❌ Error updating transaction:', updateError)
      return
    }

    // Criar promoções do combo
    const result = await promotionComboService.createComboPromotions(
      userId,
      comboId,
      transactionId
    )

    if (!result.success) {
      console.error('❌ Failed to create combo promotions:', result.error)
      
      // Marcar transação como problematic mas não falhar o webhook
      await supabase
        .from('promotion_transactions')
        .update({
          metadata: supabase.raw(`metadata || '{"promotion_creation_failed": true, "error": "${result.error}"}'`),
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        
      return
    }

    console.log('✅ Combo promotions created successfully:', result.promotion_ids)

    // Atualizar transação com IDs das promoções criadas
    await supabase
      .from('promotion_transactions')
      .update({
        metadata: supabase.raw(`metadata || '{"created_promotion_ids": ${JSON.stringify(result.promotion_ids)}}'`),
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    // TODO: Enviar notificação de sucesso para o usuário
    console.log('🎉 Checkout completed successfully for user:', userId)

  } catch (error) {
    console.error('❌ Error handling checkout completed:', error)
  }
}

/**
 * Processar pagamento de assinatura bem-sucedido
 */
async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  try {
    console.log('💰 Processing payment succeeded:', invoice.id)

    const subscriptionId = invoice.subscription as string
    const userId = invoice.metadata?.user_id

    if (!subscriptionId) {
      console.log('⚠️ No subscription found in invoice')
      return
    }

    // Buscar assinatura local
    const { data: subscription, error } = await supabase
      .from('promotion_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (error || !subscription) {
      console.error('❌ Subscription not found:', subscriptionId)
      return
    }

    // Atualizar status da assinatura
    await supabase
      .from('promotion_subscriptions')
      .update({
        status: 'active',
        total_amount_paid: supabase.raw(`total_amount_paid + ${invoice.amount_paid / 100}`),
        current_period_start: new Date(invoice.period_start * 1000).toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    // Se é um pagamento de renovação, criar novas promoções
    if (subscription.auto_renew_promotions && subscription.combo_id) {
      const result = await promotionComboService.createComboPromotions(
        subscription.user_id,
        subscription.combo_id
      )

      if (result.success) {
        // Registrar execução da assinatura
        await supabase
          .from('promotion_subscription_executions')
          .insert({
            subscription_id: subscription.id,
            execution_type: invoice.billing_reason === 'subscription_create' ? 'trial_start' : 'renewal',
            promotion_ids: result.promotion_ids,
            amount_charged: invoice.amount_paid / 100,
            stripe_invoice_id: invoice.id,
            status: 'completed',
            execution_details: {
              invoice_id: invoice.id,
              billing_reason: invoice.billing_reason,
              period_start: invoice.period_start,
              period_end: invoice.period_end
            }
          })

        // Atualizar contador de promoções criadas
        await supabase
          .from('promotion_subscriptions')
          .update({
            total_promotions_created: supabase.raw(`total_promotions_created + ${result.promotion_ids.length}`)
          })
          .eq('id', subscription.id)

        console.log('✅ Subscription renewal promotions created:', result.promotion_ids)
      } else {
        console.error('❌ Failed to create renewal promotions:', result.error)
      }
    }

    console.log('🎉 Payment succeeded for subscription:', subscription.id)

  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error)
  }
}

/**
 * Processar pagamento falhado
 */
async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  try {
    console.log('💸 Processing payment failed:', invoice.id)

    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) {
      return
    }

    // Atualizar status da assinatura
    await supabase
      .from('promotion_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    // Registrar tentativa falhada
    const { data: subscription } = await supabase
      .from('promotion_subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subscription) {
      await supabase
        .from('promotion_subscription_executions')
        .insert({
          subscription_id: subscription.id,
          execution_type: 'renewal',
          status: 'failed',
          error_message: `Payment failed for invoice ${invoice.id}`,
          execution_details: {
            invoice_id: invoice.id,
            failure_reason: invoice.last_finalization_error?.message,
            attempt_count: invoice.attempt_count
          }
        })

      // TODO: Enviar notificação de falha para o usuário
      console.log('📧 Should notify user about payment failure:', subscription.user_id)
    }

  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
  }
}

/**
 * Processar atualização de assinatura
 */
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  try {
    console.log('🔄 Processing subscription updated:', subscription.id)

    // Atualizar dados locais da assinatura
    await supabase
      .from('promotion_subscriptions')
      .update({
        status: subscription.status as any,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at ? 
          new Date(subscription.canceled_at * 1000).toISOString() : null,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log('✅ Subscription updated:', subscription.id, 'Status:', subscription.status)

  } catch (error) {
    console.error('❌ Error handling subscription updated:', error)
  }
}

/**
 * Processar cancelamento de assinatura
 */
async function handleSubscriptionCancelled(supabase: any, subscription: Stripe.Subscription) {
  try {
    console.log('❌ Processing subscription cancelled:', subscription.id)

    await supabase
      .from('promotion_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log('✅ Subscription cancelled locally:', subscription.id)

  } catch (error) {
    console.error('❌ Error handling subscription cancelled:', error)
  }
}
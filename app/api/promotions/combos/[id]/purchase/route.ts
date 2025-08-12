import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { promotionComboService } from '@/lib/promotion-combos'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * API para comprar combo de promoção
 * 
 * POST /api/promotions/combos/[id]/purchase
 * 
 * Body:
 * {
 *   "coupon_code": "WELCOME10" (optional),
 *   "payment_method": "card" | "subscription",
 *   "billing_cycle": "monthly" | "quarterly" | "yearly" (para subscription)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: comboId } = resolvedParams

    if (!comboId) {
      return NextResponse.json({
        success: false,
        error: 'Missing combo ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const { 
      coupon_code, 
      payment_method = 'card',
      billing_cycle = 'monthly'
    } = body

    console.log('🛒 Processing combo purchase:', { 
      comboId, 
      userId: session.user.id,
      coupon_code,
      payment_method,
      billing_cycle 
    })

    // 1. Calcular preço final
    const calculation = await promotionComboService.calculateComboPrice(
      comboId,
      coupon_code,
      session.user.id
    )

    if (!calculation) {
      return NextResponse.json({
        success: false,
        error: 'Combo not found or inactive'
      }, { status: 404 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // 2. Obter ou criar customer no Stripe
    let stripeCustomerId: string

    const { data: existingUser } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (existingUser?.stripe_customer_id) {
      stripeCustomerId = existingUser.stripe_customer_id
    } else {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: {
          user_id: session.user.id
        }
      })

      stripeCustomerId = customer.id

      // Salvar customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', session.user.id)
    }

    if (payment_method === 'subscription') {
      // 3. Criar assinatura
      return await createSubscription(
        supabase,
        stripe,
        session.user.id,
        stripeCustomerId,
        calculation,
        billing_cycle,
        coupon_code
      )
    } else {
      // 3. Criar pagamento único
      return await createOneTimePayment(
        supabase,
        stripe,
        session.user.id,
        stripeCustomerId,
        calculation,
        coupon_code
      )
    }

  } catch (error) {
    console.error('❌ Error processing combo purchase:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process purchase',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Criar pagamento único para combo
 */
async function createOneTimePayment(
  supabase: any,
  stripe: Stripe,
  userId: string,
  stripeCustomerId: string,
  calculation: any,
  couponCode?: string
) {
  try {
    // Criar registro de transação
    const { data: transaction, error: transactionError } = await supabase
      .from('promotion_transactions')
      .insert({
        user_id: userId,
        package_id: null, // Não é um package, é um combo
        amount: calculation.final_price,
        currency: 'EUR',
        status: 'pending',
        metadata: {
          combo_id: calculation.combo.id,
          combo_name: calculation.combo.name,
          original_price: calculation.original_price,
          combo_discount: calculation.discount_amount,
          coupon_discount: calculation.coupon_discount || 0,
          coupon_code: couponCode,
          payment_type: 'one_time',
          promotions_to_create: calculation.promotions_to_create
        }
      })
      .select()
      .single()

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }

    // Criar Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: calculation.combo.name,
            description: calculation.combo.description,
            metadata: {
              combo_id: calculation.combo.id,
              transaction_id: transaction.id
            }
          },
          unit_amount: Math.round(calculation.final_price * 100) // Converter para centavos
        },
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/braider/promotions?success=combo_purchase&transaction_id=${transaction.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/braider/promotions?cancelled=combo_purchase`,
      metadata: {
        user_id: userId,
        transaction_id: transaction.id,
        combo_id: calculation.combo.id,
        payment_type: 'combo_purchase'
      }
    })

    // Atualizar transação com session ID
    await supabase
      .from('promotion_transactions')
      .update({
        stripe_session_id: checkoutSession.id,
        stripe_status: 'pending'
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      payment_type: 'one_time',
      transaction_id: transaction.id,
      checkout_url: checkoutSession.url,
      pricing: {
        original_price: calculation.original_price,
        final_price: calculation.final_price,
        total_savings: calculation.total_savings
      }
    })

  } catch (error) {
    console.error('Error creating one-time payment:', error)
    throw error
  }
}

/**
 * Criar assinatura para combo
 */
async function createSubscription(
  supabase: any,
  stripe: Stripe,
  userId: string,
  stripeCustomerId: string,
  calculation: any,
  billingCycle: string,
  couponCode?: string
) {
  try {
    // Calcular preço da assinatura baseado no ciclo
    const cyclePrices = {
      'monthly': calculation.final_price,
      'quarterly': calculation.final_price * 3 * 0.85, // 15% desconto
      'yearly': calculation.final_price * 12 * 0.75    // 25% desconto
    }

    const cyclePrice = cyclePrices[billingCycle as keyof typeof cyclePrices] || calculation.final_price

    // Criar produto e preço no Stripe se necessário
    const product = await stripe.products.create({
      name: `${calculation.combo.name} - Assinatura ${billingCycle}`,
      description: `Assinatura ${billingCycle} do combo ${calculation.combo.name}`,
      metadata: {
        combo_id: calculation.combo.id,
        billing_cycle: billingCycle
      }
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(cyclePrice * 100),
      currency: 'eur',
      recurring: {
        interval: billingCycle === 'yearly' ? 'year' : 
                  billingCycle === 'quarterly' ? 'month' : 'month',
        interval_count: billingCycle === 'quarterly' ? 3 : 1
      }
    })

    // Criar registro de assinatura
    const currentPeriodEnd = new Date()
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else if (billingCycle === 'quarterly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('promotion_subscriptions')
      .insert({
        user_id: userId,
        combo_id: calculation.combo.id,
        billing_cycle: billingCycle,
        cycle_price: cyclePrice,
        status: 'trial', // Começar com trial se aplicável
        current_period_end: currentPeriodEnd.toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_price_id: price.id,
        auto_renew_promotions: true,
        custom_settings: {
          combo_name: calculation.combo.name,
          original_combo_price: calculation.combo.combo_price,
          subscription_discount: cyclePrice < (calculation.final_price * 12) ? 
            ((calculation.final_price * 12) - cyclePrice) : 0
        }
      })
      .select()
      .single()

    if (subscriptionError) {
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`)
    }

    // Criar Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{
        price: price.id
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
        subscription_id: subscription.id,
        combo_id: calculation.combo.id
      }
    })

    // Atualizar com Stripe subscription ID
    await supabase
      .from('promotion_subscriptions')
      .update({
        stripe_subscription_id: stripeSubscription.id,
        status: stripeSubscription.status === 'active' ? 'active' : 'trial'
      })
      .eq('id', subscription.id)

    // Registrar uso do cupom se aplicável
    if (couponCode && calculation.coupon_discount && calculation.coupon_discount > 0) {
      // Implementar registro do cupom
    }

    return NextResponse.json({
      success: true,
      payment_type: 'subscription',
      subscription_id: subscription.id,
      stripe_subscription_id: stripeSubscription.id,
      client_secret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
      billing_cycle: billingCycle,
      pricing: {
        cycle_price: cyclePrice,
        original_price: calculation.original_price,
        total_savings: calculation.total_savings,
        subscription_savings: billingCycle !== 'monthly' ? 
          (calculation.final_price * 12) - cyclePrice : 0
      }
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}
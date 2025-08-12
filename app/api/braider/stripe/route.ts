import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { 
  createBraiderStripeAccount,
  stripeMonetizationManager
} from '@/lib/stripe-monetization'

// GET /api/braider/stripe - Obter status da conta Stripe do braider
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verificar se é braider
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, user_id')
      .eq('user_id', session.user.id)
      .single()

    if (braiderError || !braider) {
      return NextResponse.json({ error: 'Braider not found' }, { status: 404 })
    }

    // Obter subscription info
    const { data: subscription, error: subError } = await supabase
      .from('braider_subscriptions')
      .select('*')
      .eq('braider_id', braider.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscription info' }, { status: 500 })
    }

    let stripeAccountStatus = null
    if (subscription?.stripe_customer_id) {
      stripeAccountStatus = await stripeMonetizationManager.getAccountStatus(
        subscription.stripe_customer_id
      )
    }

    return NextResponse.json({
      braiderId: braider.id,
      hasStripeAccount: !!subscription?.stripe_customer_id,
      stripeAccountId: subscription?.stripe_customer_id,
      subscriptionStatus: subscription?.status || 'inactive',
      accountStatus: stripeAccountStatus,
      onboardingRequired: stripeAccountStatus?.requiresOnboarding ?? true
    })

  } catch (error) {
    console.error('Unexpected error in braider stripe GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/braider/stripe - Criar conta Stripe para braider
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, returnUrl, refreshUrl } = body

    const supabase = await createClient()

    // Verificar se é braider
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, user_id')
      .eq('user_id', session.user.id)
      .single()

    if (braiderError || !braider) {
      return NextResponse.json({ error: 'Braider not found' }, { status: 404 })
    }

    // Obter dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    if (action === 'create_account') {
      // Criar conta Stripe Connect
      const stripeAccount = await createBraiderStripeAccount(braider.id, {
        name: user.name,
        email: user.email,
        country: 'PT' // Portugal
      })

      if (!stripeAccount) {
        return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Stripe account created successfully',
        stripeAccountId: stripeAccount.stripeAccountId,
        requiresOnboarding: stripeAccount.requiresOnboarding
      })

    } else if (action === 'create_onboarding_link') {
      // Obter subscription para pegar account ID
      const { data: subscription } = await supabase
        .from('braider_subscriptions')
        .select('stripe_customer_id')
        .eq('braider_id', braider.id)
        .single()

      if (!subscription?.stripe_customer_id) {
        return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 })
      }

      const onboardingUrl = await stripeMonetizationManager.createOnboardingLink(
        subscription.stripe_customer_id,
        returnUrl,
        refreshUrl
      )

      if (!onboardingUrl) {
        return NextResponse.json({ error: 'Failed to create onboarding link' }, { status: 500 })
      }

      return NextResponse.json({
        onboardingUrl
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Unexpected error in braider stripe POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
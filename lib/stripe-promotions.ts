import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export interface PromotionCheckoutSession {
  sessionId: string
  url: string
  promotionData: any
}

export interface PromotionProduct {
  id: string
  name: string
  type: 'profile_highlight' | 'hero_banner' | 'combo'
  price: number
  duration_days: number
  features: string[]
}

// Criar sessão de checkout do Stripe para promoções
export async function createPromotionCheckoutSession(
  promotionData: any,
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<PromotionCheckoutSession> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: promotionData.title,
              description: promotionData.description,
              metadata: {
                type: promotionData.type,
                duration_days: promotionData.duration_days?.toString() || '7'
              }
            },
            unit_amount: Math.round(promotionData.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'promotion_payment',
        user_id: userId,
        promotion_type: promotionData.type,
        promotion_data: JSON.stringify({
          title: promotionData.title,
          description: promotionData.description,
          type: promotionData.type,
          start_date: promotionData.start_date,
          end_date: promotionData.end_date,
          content_data: promotionData.content_data,
          package_id: promotionData.package_id,
          metadata: promotionData.metadata
        })
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos para completar
    })

    return {
      sessionId: session.id,
      url: session.url!,
      promotionData
    }
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    throw new Error(`Falha ao criar sessão de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

// Verificar status da sessão de checkout
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    })
    
    return session
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    throw new Error('Falha ao recuperar sessão de pagamento')
  }
}

// Processar webhook do Stripe para promoções
export async function handlePromotionWebhook(
  event: Stripe.Event,
  endpointSecret: string,
  rawBody: string,
  signature: string
) {
  try {
    // Verificar assinatura do webhook
    const webhookEvent = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
    
    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        const session = webhookEvent.data.object as Stripe.Checkout.Session
        
        if (session.metadata?.type === 'promotion_payment') {
          return await handlePromotionPaymentSuccess(session)
        }
        break
        
      case 'checkout.session.expired':
        const expiredSession = webhookEvent.data.object as Stripe.Checkout.Session
        
        if (expiredSession.metadata?.type === 'promotion_payment') {
          return await handlePromotionPaymentExpired(expiredSession)
        }
        break
        
      case 'payment_intent.payment_failed':
        const failedPayment = webhookEvent.data.object as Stripe.PaymentIntent
        
        if (failedPayment.metadata?.type === 'promotion_payment') {
          return await handlePromotionPaymentFailed(failedPayment)
        }
        break
    }
    
    return { received: true }
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw error
  }
}

// Processar pagamento bem-sucedido de promoção
async function handlePromotionPaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const { user_id, promotion_data } = session.metadata!
    const parsedPromotionData = JSON.parse(promotion_data!)
    
    // Criar a promoção no banco de dados com status 'pending' (aguardando aprovação)
    const promotionPayload = {
      ...parsedPromotionData,
      price: session.amount_total! / 100, // Convert from cents
      status: 'pending',
      metadata: {
        ...parsedPromotionData.metadata,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        payment_status: 'paid',
        processed_at: new Date().toISOString()
      }
    }
    
    // Fazer request para API interna para criar a promoção
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/promotions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` // Token interno para webhook
      },
      body: JSON.stringify({
        action: 'create_paid_promotion',
        user_id,
        promotion_data: promotionPayload
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      promotion_id: result.promotion_id,
      message: 'Promoção criada com sucesso após pagamento'
    }
    
  } catch (error) {
    console.error('Error handling promotion payment success:', error)
    throw error
  }
}

// Processar sessão expirada
async function handlePromotionPaymentExpired(session: Stripe.Checkout.Session) {
  // Log da sessão expirada para analytics
  console.log('Promotion checkout session expired:', {
    session_id: session.id,
    user_id: session.metadata?.user_id,
    promotion_type: session.metadata?.promotion_type
  })
  
  return {
    success: true,
    message: 'Sessão de pagamento expirada registrada'
  }
}

// Processar pagamento falhado
async function handlePromotionPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Log do pagamento falhado
  console.error('Promotion payment failed:', {
    payment_intent: paymentIntent.id,
    user_id: paymentIntent.metadata?.user_id,
    error: paymentIntent.last_payment_error?.message
  })
  
  return {
    success: true,
    message: 'Falha de pagamento registrada'
  }
}

// Criar produto recorrente para assinaturas futuras
export async function createRecurringPromotionProduct(productData: PromotionProduct) {
  try {
    const product = await stripe.products.create({
      name: productData.name,
      description: `Promoção ${productData.type} - ${productData.duration_days} dias`,
      metadata: {
        type: productData.type,
        duration_days: productData.duration_days.toString(),
        features: JSON.stringify(productData.features)
      }
    })
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(productData.price * 100),
      currency: 'eur',
      recurring: {
        interval: 'month'
      }
    })
    
    return { product, price }
  } catch (error) {
    console.error('Error creating recurring product:', error)
    throw error
  }
}

// Buscar produtos existentes do Stripe
export async function getStripePromotionProducts() {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    })
    
    return products.data.filter(product => 
      product.metadata?.type && ['profile_highlight', 'hero_banner', 'combo'].includes(product.metadata.type)
    )
  } catch (error) {
    console.error('Error fetching Stripe products:', error)
    throw error
  }
}

export { stripe }
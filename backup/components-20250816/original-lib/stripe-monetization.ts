/**
 * STRIPE MONETIZATION - Integração para cobrança de comissões
 * 
 * Este módulo gerencia:
 * - Stripe Connect para trancistas
 * - Cobrança de comissões automatizada
 * - Pagamentos de assinatura
 * - Transferências para trancistas
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Types
interface BraiderStripeAccount {
  braiderId: string
  stripeAccountId: string
  isActive: boolean
  requiresOnboarding: boolean
}

interface TransactionProcessing {
  bookingId: string
  braiderId: string
  totalAmount: number
  commissionRate: number
  description: string
  customerPaymentMethodId?: string
}

interface SubscriptionCreation {
  braiderId: string
  planType: 'basic' | 'premium'
  priceId: string
  customerId?: string
}

class StripeMonetizationManager {
  private supabase = createClient()

  /**
   * Criar conta Stripe Connect para trancista
   */
  async createBraiderStripeAccount(braiderId: string, braiderData: {
    name: string
    email: string
    country: string // 'PT' para Portugal
  }): Promise<BraiderStripeAccount | null> {
    try {
      console.log('🔗 Creating Stripe Connect account for braider:', braiderId)

      // Criar conta Express
      const account = await stripe.accounts.create({
        type: 'express',
        country: braiderData.country,
        email: braiderData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: braiderData.name.split(' ')[0],
          last_name: braiderData.name.split(' ').slice(1).join(' ') || braiderData.name.split(' ')[0],
          email: braiderData.email
        }
      })

      // Salvar no banco
      const { error } = await this.supabase
        .from('braider_subscriptions')
        .update({
          stripe_customer_id: account.id,
          updated_at: new Date().toISOString()
        })
        .eq('braider_id', braiderId)

      if (error) {
        console.error('Error saving Stripe account to database:', error)
        return null
      }

      console.log('✅ Stripe Connect account created:', account.id)

      return {
        braiderId,
        stripeAccountId: account.id,
        isActive: false,
        requiresOnboarding: true
      }

    } catch (error) {
      console.error('❌ Error creating Stripe Connect account:', error)
      return null
    }
  }

  /**
   * Gerar link de onboarding para trancista
   */
  async createOnboardingLink(stripeAccountId: string, returnUrl: string, refreshUrl: string): Promise<string | null> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding'
      })

      return accountLink.url
    } catch (error) {
      console.error('❌ Error creating onboarding link:', error)
      return null
    }
  }

  /**
   * Processar pagamento com comissão
   */
  async processPaymentWithCommission(transaction: TransactionProcessing): Promise<{
    success: boolean
    paymentIntentId?: string
    transferId?: string
    error?: string
  }> {
    try {
      console.log('💳 Processing payment with commission:', transaction)

      const commissionAmount = Math.round(transaction.totalAmount * transaction.commissionRate * 100) // Stripe uses cents
      const braiderAmount = Math.round(transaction.totalAmount * 100) - commissionAmount

      // Get braider's Stripe account
      const { data: subscription, error: subError } = await this.supabase
        .from('braider_subscriptions')
        .select('stripe_customer_id')
        .eq('braider_id', transaction.braiderId)
        .single()

      if (subError || !subscription?.stripe_customer_id) {
        return {
          success: false,
          error: 'Braider Stripe account not found'
        }
      }

      // Criar Payment Intent (cliente paga valor total)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(transaction.totalAmount * 100),
        currency: 'eur',
        description: transaction.description,
        application_fee_amount: commissionAmount,
        transfer_data: {
          destination: subscription.stripe_customer_id
        },
        metadata: {
          booking_id: transaction.bookingId,
          braider_id: transaction.braiderId,
          commission_rate: transaction.commissionRate.toString()
        }
      })

      // Atualizar transação no banco
      const { error: updateError } = await this.supabase
        .from('platform_transactions')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          is_simulated: false,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', transaction.bookingId)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id
      }

    } catch (error) {
      console.error('❌ Error processing payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }

  /**
   * Confirmar pagamento após sucesso
   */
  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        // Atualizar transação como concluída
        const { error } = await this.supabase
          .from('platform_transactions')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntentId)

        if (error) {
          console.error('Error confirming payment in database:', error)
          return false
        }

        console.log('✅ Payment confirmed:', paymentIntentId)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Error confirming payment:', error)
      return false
    }
  }

  /**
   * Criar assinatura para trancista
   */
  async createSubscription(subscription: SubscriptionCreation): Promise<{
    success: boolean
    subscriptionId?: string
    error?: string
  }> {
    try {
      console.log('📅 Creating subscription:', subscription)

      // Get or create Stripe customer
      let customerId = subscription.customerId
      if (!customerId) {
        const { data: braiderData } = await this.supabase
          .from('braiders')
          .select('user_id')
          .eq('id', subscription.braiderId)
          .single()

        if (braiderData) {
          const { data: userData } = await this.supabase
            .from('users')
            .select('name, email')
            .eq('id', braiderData.user_id)
            .single()

          if (userData) {
            const customer = await stripe.customers.create({
              name: userData.name,
              email: userData.email,
              metadata: {
                braider_id: subscription.braiderId
              }
            })
            customerId = customer.id
          }
        }
      }

      if (!customerId) {
        return {
          success: false,
          error: 'Could not create or find customer'
        }
      }

      // Criar subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: subscription.priceId }],
        metadata: {
          braider_id: subscription.braiderId,
          plan_type: subscription.planType
        }
      })

      // Atualizar no banco
      const { error } = await this.supabase
        .from('braider_subscriptions')
        .update({
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: customerId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('braider_id', subscription.braiderId)

      if (error) {
        console.error('Error saving subscription to database:', error)
        return {
          success: false,
          error: 'Database update failed'
        }
      }

      return {
        success: true,
        subscriptionId: stripeSubscription.id
      }

    } catch (error) {
      console.error('❌ Error creating subscription:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed'
      }
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.cancel(subscriptionId)

      // Atualizar no banco
      const { error } = await this.supabase
        .from('braider_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)

      if (error) {
        console.error('Error updating cancelled subscription:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error)
      return false
    }
  }

  /**
   * Obter status da conta Stripe Connect
   */
  async getAccountStatus(stripeAccountId: string): Promise<{
    isActive: boolean
    requiresOnboarding: boolean
    canReceivePayments: boolean
  }> {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId)

      return {
        isActive: account.details_submitted || false,
        requiresOnboarding: !account.details_submitted,
        canReceivePayments: account.charges_enabled || false
      }
    } catch (error) {
      console.error('❌ Error getting account status:', error)
      return {
        isActive: false,
        requiresOnboarding: true,
        canReceivePayments: false
      }
    }
  }

  /**
   * Webhook handler para eventos do Stripe
   */
  async handleWebhook(eventType: string, data: any): Promise<void> {
    try {
      console.log('🔔 Stripe webhook received:', eventType)

      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(data)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(data)
          break

        case 'account.updated':
          await this.handleAccountUpdated(data)
          break

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPaymentSuccess(data)
          break

        case 'invoice.payment_failed':
          await this.handleSubscriptionPaymentFailed(data)
          break

        default:
          console.log('Unhandled webhook event:', eventType)
      }
    } catch (error) {
      console.error('❌ Error handling webhook:', error)
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    await this.confirmPayment(paymentIntent.id)
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const { error } = await this.supabase
      .from('platform_transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating failed payment:', error)
    }
  }

  private async handleAccountUpdated(account: any): Promise<void> {
    // Update braider account status
    const { error } = await this.supabase
      .from('braider_subscriptions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', account.id)

    if (error) {
      console.error('Error updating account status:', error)
    }
  }

  private async handleSubscriptionPaymentSuccess(invoice: any): Promise<void> {
    // Handle successful subscription payment
    console.log('✅ Subscription payment successful:', invoice.subscription)
  }

  private async handleSubscriptionPaymentFailed(invoice: any): Promise<void> {
    // Handle failed subscription payment
    console.log('❌ Subscription payment failed:', invoice.subscription)
  }
}

// Singleton instance
export const stripeMonetizationManager = new StripeMonetizationManager()

// Helper functions
export async function createBraiderStripeAccount(braiderId: string, braiderData: {
  name: string
  email: string
  country: string
}) {
  return stripeMonetizationManager.createBraiderStripeAccount(braiderId, braiderData)
}

export async function processPaymentWithCommission(transaction: TransactionProcessing) {
  return stripeMonetizationManager.processPaymentWithCommission(transaction)
}

export async function createSubscription(subscription: SubscriptionCreation) {
  return stripeMonetizationManager.createSubscription(subscription)
}

export async function handleStripeWebhook(eventType: string, data: any) {
  return stripeMonetizationManager.handleWebhook(eventType, data)
}
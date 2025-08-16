/**
 * Stripe configuration and utilities
 * 
 * This file contains the Stripe configuration for server-side operations
 * and utility functions for payment processing.
 */

import { Stripe } from 'stripe'

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use compatible API version
  typescript: true,
})

export default stripe

/**
 * Create a payment intent for the checkout process
 */
export async function createPaymentIntent(
  amount: number, // Amount in cents (e.g., €10.99 = 1099)
  currency: string = 'eur',
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    console.error('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY)
    console.error('Amount:', amount, 'Currency:', currency)
    throw error
  }
}

/**
 * Retrieve a payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw new Error('Failed to retrieve payment intent')
  }
}

/**
 * Create a customer in Stripe
 */
export async function createStripeCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
) {
  try {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    })
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error('Failed to create customer')
  }
}

/**
 * Update payment intent with customer and shipping info
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  updates: {
    customer?: string
    shipping?: {
      name: string
      address: {
        line1: string
        city: string
        postal_code: string
        country: string
      }
    }
    metadata?: Record<string, string>
  }
) {
  try {
    return await stripe.paymentIntents.update(paymentIntentId, updates)
  } catch (error) {
    console.error('Error updating payment intent:', error)
    throw new Error('Failed to update payment intent')
  }
}
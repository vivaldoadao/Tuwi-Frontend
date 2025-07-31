import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent, createStripeCustomer } from '@/lib/stripe'
import { createOrder, type OrderItem } from '@/lib/data-supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      amount,
      currency = 'eur',
      customerInfo,
      items,
      shippingCost,
      notes
    } = body

    // Validate required fields
    if (!amount || !customerInfo || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Stripe customer
    const customer = await createStripeCustomer(
      customerInfo.email,
      customerInfo.name,
      {
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode,
        country: customerInfo.country
      }
    )

    // Create payment intent
    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      amount,
      currency,
      {
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        order_items: JSON.stringify(items)
      }
    )

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.productPrice * item.quantity), 0)
    
    // Transform cart items to order items
    const orderItems: OrderItem[] = items.map((item: any) => ({
      productId: item.productId || item.id,
      productName: item.productName || item.name,
      productPrice: item.productPrice || item.price,
      productImage: item.productImage || item.imageUrl,
      quantity: item.quantity,
      subtotal: (item.productPrice || item.price) * item.quantity
    }))

    // Create order in database
    const { success, orderId, error } = await createOrder({
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      shippingAddress: customerInfo.address,
      shippingCity: customerInfo.city,
      shippingPostalCode: customerInfo.postalCode,
      shippingCountry: customerInfo.country,
      items: orderItems,
      subtotal,
      shippingCost: shippingCost || 0,
      total: amount,
      paymentIntentId,
      stripeCustomerId: customer.id,
      notes
    })

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
      orderId,
      customerId: customer.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
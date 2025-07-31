import { NextRequest, NextResponse } from 'next/server'
import { retrievePaymentIntent } from '@/lib/stripe'
import { updateOrderStatus, getOrderById } from '@/lib/data-supabase'
import { sendOrderConfirmationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, orderId } = body

    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe to verify status
    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    // Update order status based on payment status
    let orderStatus: 'pending' | 'processing' | 'cancelled' = 'pending'
    
    switch (paymentIntent.status) {
      case 'succeeded':
        orderStatus = 'processing'
        break
      case 'canceled':
        orderStatus = 'cancelled'
        break
      default:
        orderStatus = 'pending'
    }

    // Update order in database
    const { success, error } = await updateOrderStatus(
      orderId,
      orderStatus,
      paymentIntentId
    )

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to update order' },
        { status: 500 }
      )
    }

    // Send confirmation email if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      try {
        // Get complete order details
        const order = await getOrderById(orderId)
        
        if (order) {
          // Send confirmation email
          await sendOrderConfirmationEmail(
            order.customerEmail,
            order.customerName,
            {
              orderId: order.id,
              customerName: order.customerName,
              items: order.items,
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              total: order.total,
              shippingAddress: order.shippingAddress,
              shippingCity: order.shippingCity,
              shippingPostalCode: order.shippingPostalCode,
              shippingCountry: order.shippingCountry,
              orderDate: order.createdAt,
              paymentIntentId: order.paymentIntentId
            }
          )
          
          console.log('✅ Order confirmation email sent for order:', orderId)
        } else {
          console.warn('⚠️ Order not found for email confirmation:', orderId)
        }
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError)
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentIntent.status,
      orderStatus,
      orderId
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
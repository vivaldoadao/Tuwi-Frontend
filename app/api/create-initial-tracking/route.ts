import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to create initial tracking events
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    console.log('📝 Creating initial tracking events for order:', orderId)

    if (orderId) {
      // Create tracking for specific order
      await createInitialTrackingForOrder(orderId)
      return NextResponse.json({
        success: true,
        message: `Initial tracking created for order ${orderId}`
      })
    } else {
      // Create tracking for all orders without tracking
      const result = await createInitialTrackingForAllOrders()
      return NextResponse.json({
        success: true,
        message: `Initial tracking created for ${result.processedOrders} orders`,
        details: result
      })
    }

  } catch (error) {
    console.error('❌ Error creating initial tracking:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    )
  }
}

async function createInitialTrackingForOrder(orderId: string): Promise<void> {
  try {
    // Get order details
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      console.error('❌ Error fetching order:', orderError)
      return
    }

    // Check if tracking already exists
    const { data: existingTracking, error: trackingError } = await supabaseAdmin
      .from('order_tracking')
      .select('id')
      .eq('order_id', orderId)
      .limit(1)

    if (trackingError) {
      console.error('❌ Error checking existing tracking:', trackingError)
      return
    }

    if (existingTracking && existingTracking.length > 0) {
      console.log('⏭️  Order already has tracking events:', orderId)
      return
    }

    // Create initial tracking events based on order status
    const trackingEvents = []

    // Always create order_created event
    trackingEvents.push({
      order_id: orderId,
      event_type: 'order_created',
      status: 'pending',
      title: 'Pedido Criado',
      description: 'Seu pedido foi criado com sucesso e está sendo processado.',
      created_by: 'system',
      created_at: orderData.created_at
    })

    // Add payment confirmed if payment exists
    if (orderData.payment_intent_id) {
      trackingEvents.push({
        order_id: orderId,
        event_type: 'payment_confirmed',
        status: 'pending',
        title: 'Pagamento Confirmado',
        description: 'Pagamento processado com sucesso via Stripe.',
        created_by: 'system',
        created_at: new Date(new Date(orderData.created_at).getTime() + 60000).toISOString() // +1 minute
      })
    }

    // Add current status event if not pending
    if (orderData.status !== 'pending') {
      let eventType: string
      let title: string
      let description: string

      switch (orderData.status) {
        case 'processing':
          eventType = 'processing_started'
          title = 'Pedido em Processamento'
          description = 'Seu pedido está sendo preparado com muito carinho.'
          break
        case 'shipped':
          eventType = 'shipped'
          title = 'Pedido Enviado'
          description = 'Seu pedido foi enviado e está a caminho do destino.'
          break
        case 'delivered':
          eventType = 'delivered'
          title = 'Pedido Entregue'
          description = 'Seu pedido foi entregue com sucesso. Esperamos que goste!'
          break
        case 'cancelled':
          eventType = 'cancelled'
          title = 'Pedido Cancelado'
          description = 'Seu pedido foi cancelado. Entre em contato conosco se tiver dúvidas.'
          break
        default:
          eventType = 'note_added'
          title = 'Status Atualizado'
          description = `Status do pedido atualizado para: ${orderData.status}`
      }

      trackingEvents.push({
        order_id: orderId,
        event_type: eventType,
        status: orderData.status,
        title,
        description,
        created_by: 'system',
        created_at: orderData.updated_at || orderData.created_at
      })
    }

    // Insert all tracking events
    const { error: insertError } = await supabaseAdmin
      .from('order_tracking')
      .insert(trackingEvents)

    if (insertError) {
      console.error('❌ Error inserting tracking events:', insertError)
    } else {
      console.log('✅ Initial tracking events created for order:', orderId, `(${trackingEvents.length} events)`)
    }

  } catch (error) {
    console.error('❌ Unexpected error creating initial tracking for order:', error)
  }
}

async function createInitialTrackingForAllOrders(): Promise<{
  processedOrders: number
  ordersWithoutTracking: string[]
  errors: string[]
}> {
  try {
    console.log('📝 Creating initial tracking for all orders without tracking...')

    // Get all orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, updated_at, status, payment_intent_id')
      .order('created_at', { ascending: true })

    if (ordersError || !orders) {
      console.error('❌ Error fetching orders:', ordersError)
      return { processedOrders: 0, ordersWithoutTracking: [], errors: [ordersError?.message || 'Unknown error'] }
    }

    console.log(`📊 Found ${orders.length} orders to check`)

    const ordersWithoutTracking: string[] = []
    const errors: string[] = []

    // Check each order for existing tracking
    for (const order of orders) {
      try {
        const { data: existingTracking, error: trackingError } = await supabaseAdmin
          .from('order_tracking')
          .select('id')
          .eq('order_id', order.id)
          .limit(1)

        if (trackingError) {
          errors.push(`Error checking tracking for ${order.id}: ${trackingError.message}`)
          continue
        }

        if (!existingTracking || existingTracking.length === 0) {
          ordersWithoutTracking.push(order.id)
        }
      } catch (error) {
        errors.push(`Unexpected error checking ${order.id}: ${String(error)}`)
      }
    }

    console.log(`📊 Found ${ordersWithoutTracking.length} orders without tracking`)

    // Create initial tracking for orders without tracking
    let processedOrders = 0
    for (const orderId of ordersWithoutTracking) {
      try {
        await createInitialTrackingForOrder(orderId)
        processedOrders++
      } catch (error) {
        errors.push(`Error creating tracking for ${orderId}: ${String(error)}`)
      }
    }

    console.log(`✅ Created initial tracking for ${processedOrders} orders`)

    return {
      processedOrders,
      ordersWithoutTracking,
      errors
    }

  } catch (error) {
    console.error('❌ Unexpected error creating initial tracking for all orders:', error)
    return {
      processedOrders: 0,
      ordersWithoutTracking: [],
      errors: [String(error)]
    }
  }
}
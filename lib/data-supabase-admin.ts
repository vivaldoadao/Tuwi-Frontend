// Admin functions that use service role to bypass RLS
import { createClient } from '@supabase/supabase-js'
import type { OrderStatus, TrackingEventType } from './data-supabase'

// Use service role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Admin version of updateOrderStatus that bypasses RLS
export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus,
  paymentIntentId?: string
): Promise<{ success: boolean, error?: string }> {
  try {
    console.log('🔧 Admin: Updating order status:', { orderId, status, paymentIntentId })
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId
    }

    // Update the order using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Admin: Error updating order status:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Admin: Order status updated successfully:', data)

    // Verify the update was successful by fetching the updated order
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('orders')
      .select('status, updated_at')
      .eq('id', orderId)
      .single()

    if (verifyError) {
      console.error('❌ Admin: Error verifying order update:', verifyError)
    } else {
      console.log('✅ Admin: Verified order status:', verifyData)
    }

    // Create tracking event for the status change
    await createTrackingEventForStatusChange(orderId, status)

    // Send notification email (don't wait for it to complete)
    sendTrackingNotificationEmail(orderId, status).catch(error => {
      console.error('❌ Error sending notification email:', error)
    })

    return { success: true }
  } catch (error) {
    console.error('❌ Admin: Unexpected error updating order status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status do pedido' }
  }
}

// Create a tracking event when order status changes
async function createTrackingEventForStatusChange(
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  try {
    console.log('📝 Creating tracking event for status change:', { orderId, newStatus })

    let eventType: TrackingEventType
    let title: string
    let description: string

    // Map status to tracking event
    switch (newStatus) {
      case 'pending':
        eventType = 'order_created'
        title = 'Pedido Criado'
        description = 'Seu pedido foi criado com sucesso e está sendo processado.'
        break
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
        console.log('⚠️  No tracking event for status:', newStatus)
        return
    }

    // Insert tracking event
    const { error } = await supabaseAdmin
      .from('order_tracking')
      .insert([{
        order_id: orderId,
        event_type: eventType,
        status: newStatus,
        title,
        description,
        created_by: 'system',
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('❌ Error creating tracking event:', error)
    } else {
      console.log('✅ Tracking event created successfully')
    }
  } catch (error) {
    console.error('❌ Unexpected error creating tracking event:', error)
  }
}

// Send tracking notification email
async function sendTrackingNotificationEmail(
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  try {
    // Only send notifications for important events
    const notifiableStatuses: OrderStatus[] = ['processing', 'shipped', 'delivered', 'cancelled']
    
    if (!notifiableStatuses.includes(newStatus)) {
      console.log('⏭️  Skipping email notification for status:', newStatus)
      return
    }

    console.log('📧 Sending tracking notification email:', { orderId, newStatus })

    // Get order details
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      console.error('❌ Error fetching order for email:', orderError)
      return
    }

    // Get the latest tracking event
    const { data: trackingData, error: trackingError } = await supabaseAdmin
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (trackingError || !trackingData) {
      console.error('❌ Error fetching tracking event for email:', trackingError)
      return
    }

    // Import email service dynamically (server-side only)
    const { sendOrderTrackingEmail } = await import('./email-service')
    
    // Send the email
    const emailSent = await sendOrderTrackingEmail(
      orderData.customer_email,
      orderData.customer_name,
      {
        orderId: orderData.id,
        customerName: orderData.customer_name,
        total: parseFloat(orderData.total),
        status: orderData.status
      },
      {
        title: trackingData.title,
        description: trackingData.description,
        location: trackingData.location,
        trackingNumber: trackingData.tracking_number,
        eventType: trackingData.event_type,
        createdAt: trackingData.created_at
      }
    )

    if (emailSent) {
      console.log('✅ Tracking notification email sent successfully')
    } else {
      console.error('❌ Failed to send tracking notification email')
    }
  } catch (error) {
    console.error('❌ Unexpected error sending tracking notification email:', error)
  }
}
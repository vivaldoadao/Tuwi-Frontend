// Server-side only tracking notification helpers
import { getOrderById, getOrderTracking, type TrackingEventType } from './data-supabase'
import { sendOrderTrackingEmail } from './email-service'

// Send tracking notification email when significant events occur (server-side only)
export async function sendTrackingNotification(
  orderId: string,
  eventType: TrackingEventType
): Promise<{ success: boolean, error?: string }> {
  try {
    // Only send notifications for important events
    const notifiableEvents: TrackingEventType[] = [
      'payment_confirmed',
      'processing_started', 
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ]
    
    if (!notifiableEvents.includes(eventType)) {
      return { success: true } // Skip notification for this event type
    }

    // Get order and recent tracking event
    const [order, trackingEvents] = await Promise.all([
      getOrderById(orderId),
      getOrderTracking(orderId)
    ])

    if (!order) {
      return { success: false, error: 'Pedido não encontrado' }
    }

    // Find the latest event of this type
    const latestEvent = trackingEvents
      .filter(event => event.eventType === eventType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!latestEvent) {
      return { success: false, error: 'Evento de tracking não encontrado' }
    }

    // Send notification email
    const emailSent = await sendOrderTrackingEmail(
      order.customerEmail,
      order.customerName,
      {
        orderId: order.id,
        customerName: order.customerName,
        total: order.total,
        status: order.status
      },
      {
        title: latestEvent.title,
        description: latestEvent.description,
        location: latestEvent.location,
        trackingNumber: latestEvent.trackingNumber,
        eventType: latestEvent.eventType,
        createdAt: latestEvent.createdAt
      }
    )

    if (!emailSent) {
      return { success: false, error: 'Falha ao enviar email de notificação' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending tracking notification:', error)
    return { success: false, error: 'Erro inesperado ao enviar notificação' }
  }
}

// Helper to trigger notification from status updates (for use in API routes)
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<void> {
  try {
    let eventType: TrackingEventType | null = null

    switch (newStatus) {
      case 'processing':
        eventType = 'processing_started'
        break
      case 'shipped':
        eventType = 'shipped'
        break
      case 'delivered':
        eventType = 'delivered'
        break
      case 'cancelled':
        eventType = 'cancelled'
        break
      default:
        return // No notification for this status
    }

    if (eventType) {
      await sendTrackingNotification(orderId, eventType)
    }
  } catch (error) {
    console.error('Error notifying order status change:', error)
    // Don't throw error to avoid breaking the main status update flow
  }
}
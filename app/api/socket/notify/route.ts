import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for database operations
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/socket/notify - Trigger real-time booking notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Received real-time notification request')
    
    const body = await request.json()
    const { type, bookingId, timestamp } = body

    if (!type || !bookingId) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, bookingId' 
      }, { status: 400 })
    }

    console.log('📋 Processing notification:', { type, bookingId, timestamp })

    // Handle different notification types
    switch (type) {
      case 'booking_created': {
        await handleBookingCreatedNotification(bookingId)
        break
      }
      
      case 'booking_status_updated': {
        const { oldStatus, newStatus, updatedBy } = body
        await handleBookingStatusNotification(bookingId, oldStatus, newStatus, updatedBy)
        break
      }
      
      // New rating-related notifications
      case 'rating_created': {
        const { braiderId, ratingId, rating, clientName } = body
        await handleRatingCreatedNotification(braiderId, ratingId, rating, clientName)
        break
      }
      
      case 'rating_response': {
        const { ratingId, braiderId, clientId, response } = body
        await handleRatingResponseNotification(ratingId, braiderId, clientId, response)
        break
      }
      
      case 'rating_flagged': {
        const { ratingId, braiderId, clientId } = body
        await handleRatingFlaggedNotification(ratingId, braiderId, clientId)
        break
      }
      
      default:
        console.warn('⚠️ Unknown notification type:', type)
        return NextResponse.json({ 
          error: 'Unknown notification type' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} notification processed`,
      bookingId
    })

  } catch (error) {
    console.error('💥 Unexpected error processing real-time notification:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle booking creation notification
async function handleBookingCreatedNotification(bookingId: string) {
  try {
    console.log('📢 Handling booking created notification for:', bookingId)
    
    const serviceClient = getServiceClient()
    
    // Get booking details with braider info
    const { data: booking, error } = await serviceClient
      .from('bookings')
      .select(`
        *,
        services(name, price),
        braiders!inner(id, user_id, name)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found for notification:', error)
      return
    }

    // Trigger WebSocket notification by calling the global notifyBookingCreated function
    // Since we can't directly access the io instance here, we'll use a workaround:
    // Store the notification in a temporary table that the WebSocket can poll, 
    // or use Next.js server-sent events, or Redis pub/sub

    console.log('✅ Booking created notification processed:', {
      bookingId,
      braiderId: booking.braider_id,
      clientName: booking.client_name
    })

    // For now, we'll log the notification. In a full implementation, you'd:
    // 1. Use Redis pub/sub to communicate with the WebSocket server
    // 2. Use a database trigger to notify the WebSocket
    // 3. Use server-sent events
    // 4. Store in a notifications table that the WebSocket polls

  } catch (error) {
    console.error('❌ Error handling booking created notification:', error)
  }
}

// Handle booking status update notification
async function handleBookingStatusNotification(
  bookingId: string, 
  oldStatus: string, 
  newStatus: string, 
  updatedBy: string
) {
  try {
    console.log('📢 Handling booking status update notification:', {
      bookingId,
      oldStatus,
      newStatus,
      updatedBy
    })

    // Similar implementation as above
    // This would trigger real-time notifications to both braider and client

    console.log('✅ Booking status update notification processed')

  } catch (error) {
    console.error('❌ Error handling booking status notification:', error)
  }
}

// ⭐ NEW RATING NOTIFICATION HANDLERS

// Handle rating creation notification
async function handleRatingCreatedNotification(
  braiderId: string, 
  ratingId: string, 
  rating: number, 
  clientName: string
) {
  try {
    console.log('⭐ Handling rating created notification:', {
      braiderId,
      ratingId,
      rating,
      clientName
    })

    const serviceClient = getServiceClient()
    
    // Get rating details with braider info
    const { data: ratingData, error } = await serviceClient
      .from('ratings')
      .select(`
        *,
        braiders!inner(id, name, user_id),
        services(name)
      `)
      .eq('id', ratingId)
      .single()

    if (error || !ratingData) {
      console.error('❌ Rating not found for notification:', error)
      return
    }

    console.log('✅ New rating notification processed:', {
      ratingId,
      braiderId,
      rating,
      braiderName: ratingData.braiders.name
    })

    // Store for WebSocket pickup
    await storeNotificationForWebSocket({
      type: 'rating_created',
      room: `braider_${braiderId}`,
      data: {
        ratingId,
        braiderId,
        rating,
        clientName,
        braiderName: ratingData.braiders.name,
        reviewTitle: ratingData.review_title,
        reviewText: ratingData.review_text,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error handling rating created notification:', error)
  }
}

// Handle braider response notification
async function handleRatingResponseNotification(
  ratingId: string,
  braiderId: string, 
  clientId: string,
  response: string
) {
  try {
    console.log('💬 Handling rating response notification:', {
      ratingId,
      braiderId,
      clientId,
      responseLength: response?.length
    })

    const serviceClient = getServiceClient()
    
    // Get braider info
    const { data: braider } = await serviceClient
      .from('braiders')
      .select('name')
      .eq('id', braiderId)
      .single()

    console.log('✅ Rating response notification processed')

    // Store for WebSocket pickup
    await storeNotificationForWebSocket({
      type: 'rating_response',
      room: `client_${clientId}`,
      data: {
        ratingId,
        braiderId,
        braiderName: braider?.name || 'Trancista',
        response: response,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error handling rating response notification:', error)
  }
}

// Handle rating flagged notification
async function handleRatingFlaggedNotification(
  ratingId: string,
  braiderId: string,
  clientId: string
) {
  try {
    console.log('⚠️ Handling rating flagged notification:', {
      ratingId,
      braiderId,
      clientId
    })

    console.log('✅ Rating flagged notification processed')

    // Store for WebSocket pickup - notify client
    if (clientId) {
      await storeNotificationForWebSocket({
        type: 'rating_flagged',
        room: `client_${clientId}`,
        data: {
          ratingId,
          message: 'Sua avaliação foi sinalizada para moderação',
          timestamp: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('❌ Error handling rating flagged notification:', error)
  }
}

// Alternative approach: Store notifications in database for WebSocket to pick up
async function storeNotificationForWebSocket(notification: any) {
  try {
    const serviceClient = getServiceClient()
    
    // Create a temporary notifications table for WebSocket communication
    const { error } = await serviceClient
      .from('websocket_notifications')
      .insert({
        type: notification.type,
        room: notification.room,
        data: notification.data,
        processed: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('❌ Error storing notification for WebSocket:', error)
    } else {
      console.log('✅ Notification stored for WebSocket processing:', notification.type)
    }
  } catch (error) {
    console.error('❌ Error storing notification:', error)
  }
}
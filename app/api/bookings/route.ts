import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateData, createBookingSchema } from '@/lib/server-validations'
import { auth } from '@/lib/auth'

// Server-side function with access to service role key
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting atomic booking creation...')
    
    // 🔒 SECURITY: Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    console.log('🔒 Checking rate limit for IP:', clientIp)
    const serviceClient = getServiceClient()
    
    const { data: rateLimitResult, error: rateLimitError } = await serviceClient
      .rpc('check_rate_limit_v2', {
        p_identifier: clientIp,
        p_action: 'create_booking', 
        p_limit: 5, // Max 5 bookings per hour per IP
        p_window_minutes: 60
      })
    
    if (rateLimitError || !rateLimitResult) {
      console.error('❌ Rate limit check failed:', rateLimitError)
      return NextResponse.json(
        { success: false, error: 'Erro interno de segurança' },
        { status: 500 }
      )
    }
    
    if (!rateLimitResult) {
      console.warn('🚫 Rate limit exceeded for IP:', clientIp)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Muitos agendamentos em pouco tempo. Aguarde alguns minutos antes de tentar novamente.' 
        },
        { status: 429 } // Too Many Requests
      )
    }
    
    console.log('✅ Rate limit check passed')
    
    // 🔒 SECURITY: Get raw data and validate session (optional for public bookings)
    const session = await auth()
    const rawBookingData = await request.json()
    
    console.log('📝 Raw booking data received:', {
      braiderId: rawBookingData.braiderId,
      date: rawBookingData.date,
      time: rawBookingData.time,
      clientEmail: rawBookingData.clientEmail
    })
    
    // 🔒 SECURITY: Validate input data
    const validation = validateData(createBookingSchema, {
      braiderId: rawBookingData.braiderId,
      serviceId: rawBookingData.serviceId,
      clientName: rawBookingData.clientName,
      clientEmail: rawBookingData.clientEmail,
      clientPhone: rawBookingData.clientPhone,
      date: rawBookingData.date,
      time: rawBookingData.time,
      locationType: rawBookingData.bookingType === 'domicilio' ? 'client_home' : 'salon',
      address: rawBookingData.clientAddress,
      notes: rawBookingData.notes || ''
    })
    
    if (!validation.success) {
      console.error('❌ Input validation failed:', validation.error)
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }
    
    const bookingData = validation.data
    console.log('✅ Input validation passed')

    // 🔒 ATOMIC TRANSACTION: Prevent race conditions
    console.log('🔒 Starting atomic transaction...')
    
    // Use RPC function for atomic booking creation
    const { data: result, error: rpcError } = await serviceClient
      .rpc('create_booking_atomic', {
        p_service_id: bookingData.serviceId,
        p_braider_id: bookingData.braiderId,
        p_booking_date: bookingData.date,
        p_booking_time: bookingData.time,
        p_service_type: bookingData.locationType === 'client_home' ? 'domicilio' : 'trancista',
        p_client_name: bookingData.clientName,
        p_client_email: bookingData.clientEmail,
        p_client_phone: bookingData.clientPhone,
        p_client_address: bookingData.address,
        p_notes: bookingData.notes,
        p_availability_id: rawBookingData.availabilityId // Optional availability ID
      })
    
    if (rpcError) {
      console.error('❌ Atomic booking creation failed:', rpcError)
      
      // Handle specific error types
      if (rpcError.message.includes('BOOKING_CONFLICT')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Este horário já está ocupado. Por favor, escolha outro horário.' 
          },
          { status: 409 }
        )
      } else if (rpcError.message.includes('AVAILABILITY_TAKEN')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Este slot de disponibilidade já foi reservado. Por favor, atualize a página e escolha outro horário.' 
          },
          { status: 409 }
        )
      } else if (rpcError.message.includes('SERVICE_NOT_FOUND')) {
        return NextResponse.json(
          { success: false, error: 'Serviço não encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Erro ao processar agendamento' },
        { status: 500 }
      )
    }
    
    if (!result || !result.booking_id) {
      console.error('❌ Unexpected: No booking ID returned from atomic function')
      return NextResponse.json(
        { success: false, error: 'Erro inesperado ao criar agendamento' },
        { status: 500 }
      )
    }
    
    console.log('✅ Atomic booking created successfully:', result.booking_id)

    // 🔄 REAL-TIME: Notify about new booking via WebSocket
    try {
      console.log('📡 Sending real-time booking notification...')
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/socket/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_created',
          bookingId: result.booking_id,
          timestamp: new Date().toISOString()
        })
      })
      
      if (notificationResponse.ok) {
        console.log('✅ Real-time notification sent successfully')
      } else {
        console.warn('⚠️ Failed to send real-time notification')
      }
    } catch (notificationError) {
      console.warn('⚠️ Real-time notification error:', notificationError)
      // Don't fail the booking creation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento realizado com sucesso!",
      bookingId: result.booking_id,
      totalAmount: result.total_amount
    })

  } catch (error) {
    console.error('Unexpected error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado ao processar agendamento' },
      { status: 500 }
    )
  }
}
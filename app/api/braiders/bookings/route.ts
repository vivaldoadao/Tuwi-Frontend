import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import { 
  validateBookingOwnership, 
  validateSession, 
  createUnauthorizedResponse,
  getBraiderByUserId 
} from '@/lib/security/ownership-validation'
import { createSecureHandler } from '@/lib/security/api-middleware'

// Server-side service client with admin privileges to bypass RLS
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function handleGET(request: NextRequest) {
  try {
    console.log('🚀 Starting braider bookings API...')
    
    // 🔒 SECURITY: Validate user session
    const session = await auth()
    const sessionValidation = validateSession(session)
    
    if (!sessionValidation.isValid) {
      console.error('❌ Invalid session:', sessionValidation.details)
      return NextResponse.json(
        { success: false, error: sessionValidation.error },
        { status: 401 }
      )
    }
    
    console.log('👤 Valid session:', {
      userId: session!.user.id,
      userEmail: session!.user.email
    })

    // 🔒 SECURITY: Get braider using email (padrão do sistema)
    const userEmail = session!.user.email
    if (!userEmail) {
      console.error('❌ No email in session')
      return createUnauthorizedResponse('Email não encontrado na sessão')
    }
    
    console.log('📧 Buscando braider por email:', userEmail)
    
    const serviceSupabase = getServiceClient()
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email, status, user_id')
      .eq('contact_email', userEmail)
      .single()

    if (braiderError || !braiderData) {
      console.error('❌ Braider not found for email:', { userEmail, error: braiderError })
      return createUnauthorizedResponse('Registro de trancista não encontrado para este usuário')
    }
    
    console.log('👩‍🦱 Braider encontrado:', { id: braiderData.id, name: braiderData.name })
    
    const braiderResult = {
      id: braiderData.id,
      name: braiderData.name,
      contactEmail: braiderData.contact_email,
      status: braiderData.status,
      userId: braiderData.user_id || session!.user.id
    }

    // Get all bookings for this braider (using secure service client after validation)
    console.log('📅 Fetching bookings...')
    const { data: bookings, error: bookingsError } = await serviceSupabase
      .from('bookings')
      .select(`
        *,
        services(name, price, duration_minutes)
      `)
      .eq('braider_id', braiderResult.id)
      .order('booking_date', { ascending: true })

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar agendamentos' },
        { status: 500 }
      )
    }

    console.log('📊 Found bookings:', bookings?.length || 0)

    // Format bookings to match the expected interface
    const formattedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      braiderId: booking.braider_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone,
      clientAddress: booking.client_address,
      date: booking.booking_date,
      time: booking.booking_time,
      bookingType: booking.service_type,
      status: booking.status === 'pending' ? 'Pendente' : 
              booking.status === 'confirmed' ? 'Confirmado' : 
              booking.status === 'cancelled' ? 'Cancelado' : 'Pendente',
      createdAt: booking.created_at,
      service: booking.services ? {
        name: booking.services.name,
        price: parseFloat(booking.services.price) || 0,
        durationMinutes: booking.services.duration_minutes || 0
      } : null
    }))

    return NextResponse.json({
      success: true,
      braider: {
        id: braiderResult.id,
        name: braiderResult.name,
        contactEmail: braiderResult.contactEmail,
        status: braiderResult.status
      },
      bookings: formattedBookings,
      count: formattedBookings.length
    })

  } catch (error) {
    console.error('💥 Unexpected error in braider bookings API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}

async function handlePATCH(request: NextRequest) {
  try {
    console.log('🔄 Starting booking status update...')
    
    // 🔒 SECURITY: Validate user session
    const session = await auth()
    const sessionValidation = validateSession(session)
    
    if (!sessionValidation.isValid) {
      console.error('❌ Invalid session:', sessionValidation.details)
      return NextResponse.json(
        { success: false, error: sessionValidation.error },
        { status: 401 }
      )
    }
    
    console.log('👤 Valid session:', {
      userId: session!.user.id,
      userEmail: session!.user.email
    })

    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'Dados insuficientes' },
        { status: 400 }
      )
    }

    console.log('📋 Update request:', { bookingId, status })

    // 🔒 CRITICAL SECURITY: Validate booking ownership (usando email como padrão do sistema)
    const ownershipValidation = await validateBookingOwnership(session!.user.id, bookingId, session!.user.email)
    
    if (!ownershipValidation.isValid) {
      console.error('🚨 OWNERSHIP VALIDATION FAILED:', ownershipValidation.details)
      return createUnauthorizedResponse(ownershipValidation.error, ownershipValidation.details)
    }

    // Use service client to get booking data after ownership validation
    const serviceSupabase = getServiceClient()

    // Get the booking data (we can trust this now after ownership validation)
    const { data: booking, error: fetchError } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        braider_id,
        client_name,
        client_email,
        client_phone,
        client_address,
        booking_date,
        booking_time,
        service_type,
        total_amount,
        notes,
        status,
        service_id
      `)
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('❌ Error fetching booking after ownership validation:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Erro interno: agendamento não encontrado após validação' },
        { status: 500 }
      )
    }

    // Get braider info for email notifications
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('user_id, name, contact_phone, location')
      .eq('id', booking.braider_id)
      .single()

    if (braiderError || !braiderData) {
      console.error('❌ Error fetching braider data:', braiderError)
      return NextResponse.json(
        { success: false, error: 'Erro interno: dados da trancista não encontrados' },
        { status: 500 }
      )
    }

    // Get service info separately
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('services')
      .select('name, duration_minutes')
      .eq('id', booking.service_id)
      .single()

    if (serviceError) {
      console.log('⚠️ Warning: Could not fetch service data:', serviceError)
    }

    console.log('✅ Booking ownership verified for braider:', braiderData.name)

    // Convert status to database format
    const dbStatus = status === 'Pendente' ? 'pending' : 
                    status === 'Confirmado' ? 'confirmed' : 
                    status === 'Cancelado' ? 'cancelled' : 'pending'

    // Update the booking status
    const { error: updateError } = await serviceSupabase
      .from('bookings')
      .update({ 
        status: dbStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('❌ Error updating booking:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status' },
        { status: 500 }
      )
    }

    console.log('✅ Booking status updated in database')

    // Handle availability updates and email notifications
    const serviceInfo = serviceData
    
    if (dbStatus === 'confirmed') {
      console.log('📧 Sending confirmation email and updating availability...')
      
      // Mark availability slot as booked
      try {
        console.log('🔍 Looking for availability slot:', {
          braider_id: booking.braider_id,
          date: booking.booking_date,
          time: booking.booking_time
        })

        // First, find the availability slot that matches this booking
        const { data: availabilitySlots, error: findError } = await serviceSupabase
          .from('braider_availability')
          .select('*')
          .eq('braider_id', booking.braider_id)
          .eq('available_date', booking.booking_date)

        if (findError) {
          console.log('❌ Error finding availability slots:', findError)
        } else {
          console.log('📊 Found availability slots:', availabilitySlots?.length || 0)
          availabilitySlots?.forEach(slot => {
            console.log(`   - ${slot.start_time} to ${slot.end_time} | Booked: ${slot.is_booked}`)
          })

          // Find slot that contains the booking time
          const bookingTime = booking.booking_time
          const matchingSlot = availabilitySlots?.find(slot => {
            const slotStart = slot.start_time
            const slotEnd = slot.end_time
            
            // Check if booking time falls within this slot
            return bookingTime >= slotStart && bookingTime < slotEnd
          })

          if (matchingSlot) {
            console.log(`✅ Found matching slot: ${matchingSlot.start_time}-${matchingSlot.end_time}`)
            
            // Update the specific slot
            const { error: updateError } = await serviceSupabase
              .from('braider_availability')
              .update({ 
                is_booked: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingSlot.id)

            if (updateError) {
              console.log('❌ Error updating availability slot:', updateError)
            } else {
              console.log('✅ Availability slot marked as booked successfully')
            }
          } else {
            console.log('⚠️ No matching availability slot found for booking time:', bookingTime)
            console.log('   Available slots:')
            availabilitySlots?.forEach(slot => {
              console.log(`   - ${slot.start_time} to ${slot.end_time}`)
            })
          }
        }
      } catch (availabilityErr) {
        console.log('⚠️ Warning: Availability update failed:', availabilityErr)
      }

      // Send confirmation email using safe email service
      console.log('📧 Sending confirmation email to:', booking.client_email)
      try {
        const { sendBookingConfirmationEmailSafe } = await import('@/lib/email-service-safe')
        const emailSent = await sendBookingConfirmationEmailSafe(booking.client_email, {
          clientName: booking.client_name,
          braiderName: braiderData.name,
          serviceName: serviceInfo?.name || 'Serviço de Tranças',
          date: new Date(booking.booking_date).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: booking.booking_time,
          location: booking.service_type === 'domicilio' ? booking.client_address || 'Endereço do cliente' : braiderData.location || 'Salão da trancista',
          bookingType: booking.service_type as 'domicilio' | 'trancista',
          price: booking.total_amount || 0,
          duration: serviceInfo?.duration_minutes || 60,
          clientPhone: booking.client_phone,
          clientAddress: booking.client_address,
          braiderPhone: braiderData.contact_phone,
          specialInstructions: booking.notes
        })
        
        if (emailSent) {
          console.log('✅ Confirmation email sent successfully')
        } else {
          console.log('⚠️ Confirmation email could not be sent (safe mode)')
        }
      } catch (emailError) {
        console.log('⚠️ Email service error:', emailError instanceof Error ? emailError.message : 'Unknown error')
      }
      
    } else if (dbStatus === 'cancelled') {
      console.log('📧 Sending rejection email and freeing availability...')
      
      // Free up availability slot
      try {
        console.log('🔍 Looking for availability slot to free up:', {
          braider_id: booking.braider_id,
          date: booking.booking_date,
          time: booking.booking_time
        })

        // Find the availability slot that matches this booking
        const { data: availabilitySlots, error: findError } = await serviceSupabase
          .from('braider_availability')
          .select('*')
          .eq('braider_id', booking.braider_id)
          .eq('available_date', booking.booking_date)

        if (findError) {
          console.log('❌ Error finding availability slots:', findError)
        } else {
          console.log('📊 Found availability slots:', availabilitySlots?.length || 0)
          
          // Find slot that contains the booking time
          const bookingTime = booking.booking_time
          const matchingSlot = availabilitySlots?.find(slot => {
            const slotStart = slot.start_time
            const slotEnd = slot.end_time
            
            // Check if booking time falls within this slot
            return bookingTime >= slotStart && bookingTime < slotEnd
          })

          if (matchingSlot) {
            console.log(`✅ Found matching slot: ${matchingSlot.start_time}-${matchingSlot.end_time}`)
            
            // Update the specific slot to free it up
            const { error: updateError } = await serviceSupabase
              .from('braider_availability')
              .update({ 
                is_booked: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingSlot.id)

            if (updateError) {
              console.log('❌ Error freeing availability slot:', updateError)
            } else {
              console.log('✅ Availability slot freed up successfully')
            }
          } else {
            console.log('⚠️ No matching availability slot found to free up for booking time:', bookingTime)
          }
        }
      } catch (availabilityErr) {
        console.log('⚠️ Warning: Availability update failed:', availabilityErr)
      }

      // Send rejection email using safe email service
      console.log('📧 Sending rejection email to:', booking.client_email)
      try {
        const { sendBookingRejectionEmailSafe } = await import('@/lib/email-service-safe')
        const emailSent = await sendBookingRejectionEmailSafe(booking.client_email, {
          clientName: booking.client_name,
          braiderName: braiderData.name,
          serviceName: serviceInfo?.name || 'Serviço de Tranças',
          date: new Date(booking.booking_date).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: booking.booking_time,
          location: booking.service_type === 'domicilio' ? booking.client_address || 'Endereço do cliente' : braiderData.location || 'Salão da trancista',
          bookingType: booking.service_type as 'domicilio' | 'trancista',
          price: booking.total_amount || 0,
          duration: serviceInfo?.duration_minutes || 60,
          clientPhone: booking.client_phone,
          clientAddress: booking.client_address,
          braiderPhone: braiderData.contact_phone,
          specialInstructions: booking.notes
        })
        
        if (emailSent) {
          console.log('✅ Rejection email sent successfully')
        } else {
          console.log('⚠️ Rejection email could not be sent (safe mode)')
        }
      } catch (emailError) {
        console.log('⚠️ Email service error:', emailError instanceof Error ? emailError.message : 'Unknown error')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso'
    })

  } catch (error) {
    console.error('💥 Unexpected error updating booking status:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}

// Apply security middleware to exports
export const GET = createSecureHandler(handleGET, {
  requireAuth: true,
  rateLimit: {
    max: 20, // Max 20 requests per hour for braider bookings
    windowMinutes: 60,
    action: 'braider_bookings_get'
  },
  logRequests: true
})

export const PATCH = createSecureHandler(handlePATCH, {
  requireAuth: true,
  rateLimit: {
    max: 10, // Max 10 booking updates per hour
    windowMinutes: 60,
    action: 'braider_bookings_patch'
  },
  logRequests: true,
  validateInput: true
})
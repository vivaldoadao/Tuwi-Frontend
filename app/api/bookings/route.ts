import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side function with access to service role key
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()
    const serviceClient = getServiceClient()

    // First get the service price
    let servicePrice = 0
    if (bookingData.serviceId) {
      const { data: serviceData } = await serviceClient
        .from('services')
        .select('price')
        .eq('id', bookingData.serviceId)
        .single()
      
      if (serviceData) {
        servicePrice = parseFloat(serviceData.price) || 0
      }
    }

    // Check for existing booking conflicts (same client, same date/time)
    const { data: existingBookings, error: conflictError } = await serviceClient
      .from('bookings')
      .select('id, status, booking_date, booking_time')
      .eq('client_email', bookingData.clientEmail)
      .eq('booking_date', bookingData.date)
      .eq('booking_time', bookingData.time)
      .in('status', ['pending', 'confirmed']) // Check both pending and confirmed

    if (conflictError) {
      console.error('Error checking for booking conflicts:', conflictError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar conflitos de agendamento' },
        { status: 500 }
      )
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você já possui um agendamento neste mesmo dia e horário. Por favor, escolha outro horário.' 
        },
        { status: 409 } // Conflict status code
      )
    }

    // Create the booking
    const { data, error } = await serviceClient
      .from('bookings')
      .insert([{
        service_id: bookingData.serviceId,
        client_id: null, // Allow null for non-registered clients
        braider_id: bookingData.braiderId,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        service_type: bookingData.bookingType,
        client_name: bookingData.clientName,
        client_email: bookingData.clientEmail,
        client_phone: bookingData.clientPhone,
        client_address: bookingData.clientAddress,
        status: 'pending',
        total_amount: servicePrice,
        notes: ''
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // If availability ID was provided, mark as booked
    if (bookingData.availabilityId) {
      const { error: availabilityError } = await serviceClient
        .from('braider_availability')
        .update({ is_booked: true, updated_at: new Date().toISOString() })
        .eq('id', bookingData.availabilityId)

      if (availabilityError) {
        console.error('Error marking availability as booked:', availabilityError)
        // Don't fail the booking if we can't mark availability
      }
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento realizado com sucesso!",
      bookingId: data.id
    })

  } catch (error) {
    console.error('Unexpected error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado ao processar agendamento' },
      { status: 500 }
    )
  }
}
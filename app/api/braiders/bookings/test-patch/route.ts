import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Server-side service client with admin privileges to bypass RLS
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🧪 TEST API: Starting booking status update...')
    
    const { bookingId, status } = await request.json()
    console.log('📋 TEST API: Update request:', { bookingId, status })

    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()

    // Get booking data
    const { data: booking, error: fetchError } = await serviceSupabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('❌ TEST API: Error fetching booking:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ TEST API: Booking found:', booking.client_name)

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
      console.error('❌ TEST API: Error updating booking:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status' },
        { status: 500 }
      )
    }

    console.log('✅ TEST API: Booking status updated successfully')

    // Simple availability update (if confirmed)
    if (dbStatus === 'confirmed') {
      const { error: availabilityError } = await serviceSupabase
        .from('braider_availability')
        .update({ is_booked: true })
        .eq('braider_id', booking.braider_id)
        .eq('available_date', booking.booking_date)
        .eq('start_time', booking.booking_time)

      if (availabilityError) {
        console.log('⚠️ TEST API: Could not update availability:', availabilityError.message)
      } else {
        console.log('✅ TEST API: Availability slot marked as booked')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso (TEST API)',
      debug: {
        bookingId,
        oldStatus: booking.status,
        newStatus: dbStatus
      }
    })

  } catch (error) {
    console.error('💥 TEST API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
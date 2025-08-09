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

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting user bookings API...')
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('👤 Authenticated user:', { 
      email: session.user.email 
    })

    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()

    // Get user's confirmed bookings with related data
    console.log('📅 Fetching user bookings...')
    const { data: bookings, error: bookingsError } = await serviceSupabase
      .from('bookings')
      .select(`
        *,
        services(id, name, price, duration_minutes),
        braiders!bookings_braider_id_fkey(id, name, contact_phone, location)
      `)
      .eq('client_email', session.user.email)
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })

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
      status: 'Confirmado', // Only confirmed bookings
      createdAt: booking.created_at,
      service: booking.services ? {
        id: booking.services.id,
        name: booking.services.name,
        price: parseFloat(booking.services.price) || 0,
        durationMinutes: booking.services.duration_minutes || 0
      } : null,
      braider: booking.braiders ? {
        id: booking.braiders.id,
        name: booking.braiders.name,
        contactPhone: booking.braiders.contact_phone,
        location: booking.braiders.location
      } : null
    }))

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      count: formattedBookings.length
    })

  } catch (error) {
    console.error('💥 Unexpected error in user bookings API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
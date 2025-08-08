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
    console.log('🚀 Starting braider bookings API...')
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('👤 Authenticated user:', { 
      id: session.user.id, 
      email: session.user.email, 
      role: session.user.role 
    })

    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()

    // First, find user by email to get user_id
    console.log('🔍 Finding user by email...', session.user.email)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', session.user.email!)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found for email:', session.user.email, userError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('👤 User ID found:', userData.id)

    // Now find braider by user_id (direct relationship)
    console.log('🔍 Finding braider for user_id...', userData.id)
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email, status, user_id')
      .eq('user_id', userData.id)
      .single()

    if (braiderError || !braiderData) {
      console.error('❌ Braider not found for user_id:', userData.id, braiderError)
      return NextResponse.json(
        { success: false, error: 'Registro de trancista não encontrado para este usuário' },
        { status: 404 }
      )
    }

    console.log('👩‍🦱 Braider found:', braiderData.id)

    // Get all bookings for this braider
    console.log('📅 Fetching bookings...')
    const { data: bookings, error: bookingsError } = await serviceSupabase
      .from('bookings')
      .select(`
        *,
        services(name, price, duration_minutes)
      `)
      .eq('braider_id', braiderData.id)
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
        id: braiderData.id,
        name: braiderData.name,
        contactEmail: braiderData.contact_email,
        status: braiderData.status
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

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔄 Starting booking status update...')
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'Dados insuficientes' },
        { status: 400 }
      )
    }

    console.log('📋 Update request:', { bookingId, status })

    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()

    // First verify the booking belongs to this braider
    const { data: booking, error: fetchError } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        braider_id,
        braiders!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // Verify ownership
    const braiderInfo = Array.isArray(booking.braiders) ? booking.braiders[0] : booking.braiders
    if (braiderInfo?.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 403 }
      )
    }

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

    console.log('✅ Booking status updated successfully')

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
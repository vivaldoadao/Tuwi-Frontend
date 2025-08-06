import { NextResponse } from 'next/server'
import { withBraider, type AuthenticatedRequest } from '@/lib/api-auth'
import { getBraiderBookings, createBooking, updateBookingStatus, type Booking } from '@/lib/data'

// GET /api/braiders/bookings - Get braider's bookings (braiders only)
export const GET = withBraider(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    // Get bookings for the authenticated braider
    const bookings = await getBraiderBookings(request.user.id)
    
    let filteredBookings = bookings

    if (status) {
      filteredBookings = bookings.filter(booking => booking.status === status)
    }

    if (limit) {
      filteredBookings = filteredBookings.slice(0, parseInt(limit))
    }

    return NextResponse.json({ bookings: filteredBookings })
  } catch (error) {
    console.error('Error fetching braider bookings:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
})

// PUT /api/braiders/bookings - Update booking status (braiders only)
export const PUT = withBraider(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { bookingId, status, notes } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'ID do agendamento e status são obrigatórios' },
        { status: 400 }
      )
    }

    const validStatuses = ['Pendente', 'Confirmado', 'Em Andamento', 'Concluído', 'Cancelado']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Verify the booking belongs to this braider
    const braiderBookings = await getBraiderBookings(request.user.id)
    const booking = braiderBookings.find(b => b.id === bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou não autorizado' },
        { status: 404 }
      )
    }

    const result = await updateBookingStatus(bookingId, status, notes)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Status do agendamento atualizado com sucesso' 
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Erro ao atualizar agendamento' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating booking status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
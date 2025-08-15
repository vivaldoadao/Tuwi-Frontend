import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Fetch braider availability
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Getting braider availability...')
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const date = searchParams.get('date')
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email é obrigatório' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find braider directly by email (standard pattern used throughout the system)
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('contact_email', email)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Build query for availability (using snake_case field names from database)
    let query = serviceSupabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderData.id)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Filter by date if provided, or date range for week view
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    
    if (dateStart && dateEnd) {
      // Week range query (more efficient than 7 separate calls)
      query = query.gte('available_date', dateStart).lte('available_date', dateEnd)
      console.log('📊 Querying date range:', dateStart, 'to', dateEnd)
    } else if (date) {
      // Single day query
      query = query.eq('available_date', date)
      console.log('📅 Querying single date:', date)
    }

    const { data: availabilityData, error: availabilityError } = await query
    
    if (availabilityError) {
      console.error('❌ Error fetching availability:', availabilityError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar disponibilidade: ' + availabilityError.message 
      }, { status: 500 })
    }
    
    // Convert snake_case to camelCase for frontend
    const formattedAvailability = (availabilityData || []).map(item => ({
      id: item.id,
      braiderId: item.braider_id,
      date: item.available_date,
      startTime: item.start_time,
      endTime: item.end_time,
      isBooked: item.is_booked,
      created_at: item.created_at,
      updated_at: item.updated_at
    }))
    
    console.log('✅ Availability fetched successfully:', formattedAvailability.length, 'slots')
    
    return NextResponse.json({ 
      success: true, 
      data: formattedAvailability
    })
    
  } catch (error) {
    console.error('💥 Error fetching availability:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao buscar disponibilidade',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST - Add new availability slot
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating availability slot...')
    
    const { email, date, startTime, endTime } = await request.json()
    
    if (!email || !date || !startTime || !endTime) {
      return NextResponse.json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find braider directly by email (standard pattern used throughout the system)
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('contact_email', email)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Check for overlapping availability
    const { data: overlapping, error: overlapError } = await serviceSupabase
      .from('braider_availability')
      .select('id')
      .eq('braider_id', braiderData.id)
      .eq('available_date', date)
      .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`)
    
    if (overlapError) {
      console.error('❌ Error checking overlap:', overlapError)
    } else if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Já existe um horário conflitante neste período' 
      }, { status: 400 })
    }

    // Create new availability slot (using snake_case field names)
    const availabilityData = {
      braider_id: braiderData.id,
      available_date: date,
      start_time: startTime,
      end_time: endTime,
      is_booked: false,
      created_at: new Date().toISOString()
    }
    
    const { data: newAvailability, error: availabilityError } = await serviceSupabase
      .from('braider_availability')
      .insert(availabilityData)
      .select()
      .single()
    
    if (availabilityError) {
      console.error('❌ Error creating availability:', availabilityError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao criar horário: ' + availabilityError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Availability created successfully:', newAvailability.id)
    
    // Convert snake_case to camelCase for frontend
    const formattedAvailability = {
      id: newAvailability.id,
      braiderId: newAvailability.braider_id,
      date: newAvailability.available_date,
      startTime: newAvailability.start_time,
      endTime: newAvailability.end_time,
      isBooked: newAvailability.is_booked,
      created_at: newAvailability.created_at
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Horário adicionado com sucesso!',
      data: formattedAvailability
    })
    
  } catch (error) {
    console.error('💥 Error creating availability:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao criar horário',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE - Remove availability slot
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting availability slot...')
    
    const { searchParams } = new URL(request.url)
    const availabilityId = searchParams.get('availabilityId')
    const email = searchParams.get('email')
    
    if (!availabilityId || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do horário e email são obrigatórios' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find braider directly by email (standard pattern used throughout the system)
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('contact_email', email)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Verify availability belongs to this braider and is not booked
    const { data: availabilityData, error: availabilityCheckError } = await serviceSupabase
      .from('braider_availability')
      .select('id, is_booked')
      .eq('id', availabilityId)
      .eq('braider_id', braiderData.id)
      .single()
    
    if (availabilityCheckError || !availabilityData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Horário não encontrado ou não autorizado' 
      }, { status: 404 })
    }

    if (availabilityData.is_booked) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não é possível remover um horário que já está reservado' 
      }, { status: 400 })
    }

    // Delete the availability slot
    const { error: deleteError } = await serviceSupabase
      .from('braider_availability')
      .delete()
      .eq('id', availabilityId)
    
    if (deleteError) {
      console.error('❌ Error deleting availability:', deleteError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao deletar horário: ' + deleteError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Availability deleted successfully:', availabilityId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Horário removido com sucesso!'
    })
    
  } catch (error) {
    console.error('💥 Error deleting availability:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao remover horário',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
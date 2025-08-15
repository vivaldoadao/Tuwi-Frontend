import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const braiderId = '2ddcc714-2375-4a19-b41e-3b5c4783b65e'
    
    console.log('🔍 Checking availability for braider:', braiderId)
    
    // 1. Verificar se a trancista existe
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('id', braiderId)
      .single()
    
    // 2. Buscar disponibilidades para esta trancista
    const { data: availability, error: availabilityError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })
    
    // 3. Buscar disponibilidades futuras
    const today = new Date().toISOString().split('T')[0]
    const { data: futureAvailability, error: futureError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .gte('available_date', today)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })
    
    return NextResponse.json({
      success: true,
      data: {
        braider: {
          data: braider,
          error: braiderError
        },
        all_availability: {
          count: availability?.length || 0,
          data: availability?.slice(0, 5),
          error: availabilityError
        },
        future_availability: {
          count: futureAvailability?.length || 0,
          data: futureAvailability?.slice(0, 10),
          error: futureError,
          today: today
        }
      }
    })
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro inesperado',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
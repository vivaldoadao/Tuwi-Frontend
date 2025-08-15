import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const braiderId = '2ddcc714-2375-4a19-b41e-3b5c4783b65e'
    
    console.log('🚀 Creating sample availability for braider:', braiderId)
    
    // Verificar se a trancista existe
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, name')
      .eq('id', braiderId)
      .single()
    
    if (braiderError || !braider) {
      return NextResponse.json({
        success: false,
        message: 'Trancista não encontrada',
        error: braiderError
      }, { status: 404 })
    }
    
    console.log('✅ Braider found:', braider.name)
    
    // Deletar disponibilidades existentes para esta trancista
    await supabase
      .from('braider_availability')
      .delete()
      .eq('braider_id', braiderId)
    
    // Criar disponibilidades para os próximos 7 dias
    const availabilities = []
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Horários da manhã
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
        is_booked: false
      })
      
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '10:00',
        end_time: '11:00',
        is_booked: false
      })
      
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '11:00',
        end_time: '12:00',
        is_booked: i === 3 // Um slot ocupado no terceiro dia para exemplo
      })
      
      // Horários da tarde
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '14:00',
        end_time: '15:00',
        is_booked: false
      })
      
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '15:00',
        end_time: '16:00',
        is_booked: false
      })
      
      availabilities.push({
        braider_id: braiderId,
        available_date: dateStr,
        start_time: '16:00',
        end_time: '17:00',
        is_booked: i === 2 // Outro slot ocupado no segundo dia
      })
    }
    
    console.log('📅 Creating', availabilities.length, 'availability slots')
    
    const { data: createdAvailability, error: createError } = await supabase
      .from('braider_availability')
      .insert(availabilities)
      .select()
    
    if (createError) {
      console.error('❌ Error creating availability:', createError)
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar disponibilidades',
        error: createError
      }, { status: 500 })
    }
    
    console.log('✅ Created', createdAvailability?.length, 'availability slots')
    
    // Verificar dados criados
    const { data: allAvailability, error: queryError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (queryError) {
      console.error('❌ Error querying availability:', queryError)
    }
    
    return NextResponse.json({
      success: true,
      message: `Criadas ${createdAvailability?.length || 0} disponibilidades para ${braider.name}`,
      data: {
        braider: braider,
        created_slots: createdAvailability?.length || 0,
        all_slots: allAvailability?.length || 0,
        sample_slots: allAvailability?.slice(0, 5).map(slot => 
          `${slot.date} ${slot.start_time}-${slot.end_time} (${slot.is_booked ? 'OCUPADO' : 'LIVRE'})`
        )
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
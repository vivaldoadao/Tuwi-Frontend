import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking braider_availability table structure...')
    
    // 1. Verificar se a tabela existe e quais colunas tem
    const { data: allData, error: allError } = await supabase
      .from('braider_availability')
      .select('*')
      .limit(1)
    
    console.log('📊 Sample record:', allData?.[0])
    console.log('❌ Error (if any):', allError)
    
    // 2. Contar total de registros
    const { count, error: countError } = await supabase
      .from('braider_availability')
      .select('*', { count: 'exact', head: true })
    
    // 3. Tentar buscar com available_date
    const { data: availableDateData, error: availableDateError } = await supabase
      .from('braider_availability')
      .select('*')
      .limit(1)
    
    // 4. Verificar braiders existentes
    const { data: braiders, error: braidersError } = await supabase
      .from('braiders')
      .select('id, name, contact_email')
      .limit(3)
    
    return NextResponse.json({
      success: true,
      data: {
        table_info: {
          total_records: count,
          count_error: countError,
          sample_record: allData?.[0],
          all_error: allError
        },
        available_date_test: {
          data: availableDateData?.[0],
          error: availableDateError
        },
        braiders_sample: {
          data: braiders,
          error: braidersError
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
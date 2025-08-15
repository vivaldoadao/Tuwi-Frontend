const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugAvailability() {
  console.log('🔍 DEBUGANDO DISPONIBILIDADE DA TRANCISTA...\n')
  
  const braiderId = '2ddcc714-2375-4a19-b41e-3b5c4783b65e'
  
  try {
    // 1. Verificar se a trancista existe
    console.log('1️⃣ Verificando se a trancista existe...')
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('id', braiderId)
      .single()
    
    if (braiderError) {
      console.error('❌ Erro ao buscar trancista:', braiderError)
      return
    }
    
    console.log(`✅ Trancista encontrada: ${braider.name} (${braider.contact_email})`)
    
    // 2. Verificar total de disponibilidades
    console.log('\n2️⃣ Verificando disponibilidades totais...')
    const { data: allAvailability, error: allError, count } = await supabase
      .from('braider_availability')
      .select('*', { count: 'exact' })
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as disponibilidades:', allError)
    } else {
      console.log(`📊 Total de registros de disponibilidade: ${count}`)
      if (allAvailability && allAvailability.length > 0) {
        console.log('Primeiros registros:')
        allAvailability.slice(0, 3).forEach((avail, index) => {
          console.log(`   ${index + 1}. ${avail.braider_id} - ${avail.available_date} ${avail.start_time}-${avail.end_time} (${avail.is_booked ? 'OCUPADO' : 'LIVRE'})`)
        })
      }
    }
    
    // 3. Verificar disponibilidades para esta trancista específica
    console.log('\n3️⃣ Verificando disponibilidades da trancista específica...')
    const { data: braiderAvailability, error: braiderAvailError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (braiderAvailError) {
      console.error('❌ Erro ao buscar disponibilidades da trancista:', braiderAvailError)
    } else {
      console.log(`📋 Disponibilidades encontradas para ${braider.name}: ${braiderAvailability?.length || 0}`)
      if (braiderAvailability && braiderAvailability.length > 0) {
        braiderAvailability.forEach((avail, index) => {
          console.log(`   ${index + 1}. ${avail.available_date} ${avail.start_time}-${avail.end_time} (${avail.is_booked ? 'OCUPADO' : 'LIVRE'})`)
        })
      } else {
        console.log('⚠️ Nenhuma disponibilidade encontrada para esta trancista!')
      }
    }
    
    // 4. Verificar apenas disponibilidades futuras
    console.log('\n4️⃣ Verificando disponibilidades futuras...')
    const today = new Date().toISOString().split('T')[0]
    const { data: futureAvailability, error: futureError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .gte('available_date', today)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (futureError) {
      console.error('❌ Erro ao buscar disponibilidades futuras:', futureError)
    } else {
      console.log(`📅 Disponibilidades futuras (>= ${today}): ${futureAvailability?.length || 0}`)
      if (futureAvailability && futureAvailability.length > 0) {
        futureAvailability.forEach((avail, index) => {
          console.log(`   ${index + 1}. ${avail.available_date} ${avail.start_time}-${avail.end_time} (${avail.is_booked ? 'OCUPADO' : 'LIVRE'})`)
        })
      }
    }
    
    // 5. Testar criação de disponibilidade de exemplo (apenas se não existir nenhuma)
    if (!braiderAvailability || braiderAvailability.length === 0) {
      console.log('\n5️⃣ Criando disponibilidades de exemplo...')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const testAvailabilities = [
        {
          braider_id: braiderId,
          available_date: tomorrowStr,
          start_time: '09:00',
          end_time: '10:00',
          is_booked: false
        },
        {
          braider_id: braiderId,
          available_date: tomorrowStr,
          start_time: '10:00',
          end_time: '11:00',
          is_booked: false
        },
        {
          braider_id: braiderId,
          available_date: tomorrowStr,
          start_time: '14:00',
          end_time: '15:00',
          is_booked: true
        }
      ]
      
      const { data: createdAvailability, error: createError } = await supabase
        .from('braider_availability')
        .insert(testAvailabilities)
        .select()
      
      if (createError) {
        console.error('❌ Erro ao criar disponibilidades de exemplo:', createError)
      } else {
        console.log(`✅ Criadas ${createdAvailability?.length || 0} disponibilidades de exemplo para ${tomorrowStr}`)
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar
debugAvailability()
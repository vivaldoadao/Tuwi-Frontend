// Script para debuggar problema dos serviços
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugServicesIssue() {
  console.log('🔍 DEBUGANDO PROBLEMA DOS SERVIÇOS...\n')
  
  try {
    // 1. Verificar quantos serviços existem no total
    console.log('1️⃣ Verificando serviços totais no banco...')
    const { data: allServices, error: allServicesError, count: totalCount } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
    
    if (allServicesError) {
      console.error('❌ Erro ao buscar todos os serviços:', allServicesError)
    } else {
      console.log(`📊 Total de serviços no banco: ${totalCount}`)
      allServices?.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} - Braider: ${service.braider_id} - ID: ${service.id}`)
      })
    }
    
    // 2. Verificar braiders existentes
    console.log('\n2️⃣ Verificando braiders existentes...')
    const { data: allBraiders, error: braidersError } = await supabase
      .from('braiders')
      .select('id, name, contact_email, status')
      .order('created_at', { ascending: false })
    
    if (braidersError) {
      console.error('❌ Erro ao buscar braiders:', braidersError)
    } else {
      console.log(`📊 Total de braiders: ${allBraiders?.length}`)
      allBraiders?.forEach((braider, index) => {
        console.log(`   ${index + 1}. ${braider.name} (${braider.contact_email}) - Status: ${braider.status} - ID: ${braider.id}`)
      })
    }
    
    // 3. Buscar serviços para o usuário específico por email
    console.log('\n3️⃣ Verificando serviços para znattechnology95@gmail.com...')
    const targetEmail = 'znattechnology95@gmail.com'
    
    // Primeiro encontrar o braider
    const { data: targetBraider, error: targetBraiderError } = await supabase
      .from('braiders')
      .select('id, name, contact_email')
      .eq('contact_email', targetEmail)
      .single()
    
    if (targetBraiderError) {
      console.error('❌ Braider não encontrado para', targetEmail, ':', targetBraiderError)
    } else {
      console.log('✅ Braider encontrado:', targetBraider)
      
      // Buscar serviços deste braider
      const { data: braiderServices, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('braider_id', targetBraider.id)
      
      if (servicesError) {
        console.error('❌ Erro ao buscar serviços do braider:', servicesError)
      } else {
        console.log(`📋 Serviços encontrados para ${targetBraider.name}: ${braiderServices?.length}`)
        braiderServices?.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} - €${service.price} - ${service.duration_minutes}min`)
          console.log(`      Descrição: ${service.description}`)
          console.log(`      Criado em: ${service.created_at}`)
        })
      }
    }
    
    // 4. Verificar RLS policies para services
    console.log('\n4️⃣ Testando acesso RLS para services...')
    
    // Tentar buscar com client normal (simula usuário logado)
    const normalClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: rlsServices, error: rlsError } = await normalClient
      .from('services')
      .select('*')
      .limit(5)
    
    if (rlsError) {
      console.log('⚠️ RLS bloqueou acesso normal:', rlsError.message)
    } else {
      console.log(`✅ RLS permite acesso normal: ${rlsServices?.length} serviços visíveis`)
    }
    
    // 5. Verificar se pode criar novo serviço
    console.log('\n5️⃣ Testando criação de serviço...')
    
    if (targetBraider) {
      const testService = {
        braider_id: targetBraider.id,
        name: 'Teste Service - ' + Date.now(),
        description: 'Serviço de teste para debug',
        price: '50.00',
        duration_minutes: 120,
        category: 'tranças',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: newService, error: createError } = await supabase
        .from('services')
        .insert(testService)
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Erro ao criar serviço teste:', createError)
      } else {
        console.log('✅ Serviço teste criado com sucesso:', newService.id)
        
        // Deletar o serviço teste
        await supabase
          .from('services')
          .delete()
          .eq('id', newService.id)
        console.log('🗑️ Serviço teste removido')
      }
    }
    
    console.log('\n📋 RESUMO:')
    console.log(`• Total de serviços no banco: ${totalCount}`)
    console.log(`• Total de braiders: ${allBraiders?.length}`)
    console.log(`• Braider ${targetEmail}: ${targetBraider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`)
    if (targetBraider) {
      console.log(`• Serviços do braider: ${braiderServices?.length || 0}`)
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar
debugServicesIssue()
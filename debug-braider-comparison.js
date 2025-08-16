// Script para comparar as duas fontes de dados dos braiders
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBraiderComparison() {
  try {
    console.log('🔍 Comparando fontes de dados dos braiders...\n')
    
    // 1. Verificar braiders direto da tabela (getBraiderById usa este)
    console.log('📋 1. Dados diretos da tabela "braiders":')
    const { data: directBraiders, error: directError } = await supabase
      .from('braiders')
      .select('id, name, contact_email, status')
      .eq('status', 'approved')
      .limit(10)
    
    if (directError) {
      console.error('❌ Erro na busca direta:', directError)
    } else {
      console.log(`✅ Encontrados ${directBraiders?.length || 0} braiders na tabela direta:`)
      directBraiders?.forEach((braider, index) => {
        console.log(`   ${index + 1}. ID: ${braider.id}`)
        console.log(`      Nome: ${braider.name || 'null'}`)
        console.log(`      Email: ${braider.contact_email || 'null'}`)
        console.log(`      Status: ${braider.status}`)
        console.log('      ---')
      })
    }
    
    console.log('\n📊 2. Dados da view "braiders_with_stats" (getAllBraidersWithRealRatings usa esta):')
    const { data: viewBraiders, error: viewError } = await supabase
      .from('braiders_with_stats')
      .select('id, user_name, user_email, status')
      .eq('status', 'approved')
      .limit(10)
    
    if (viewError) {
      console.error('❌ Erro na busca da view:', viewError)
    } else {
      console.log(`✅ Encontrados ${viewBraiders?.length || 0} braiders na view:`)
      viewBraiders?.forEach((braider, index) => {
        console.log(`   ${index + 1}. ID: ${braider.id}`)
        console.log(`      Nome: ${braider.user_name || 'null'}`)
        console.log(`      Email: ${braider.user_email || 'null'}`)
        console.log(`      Status: ${braider.status}`)
        console.log('      ---')
      })
    }
    
    // 3. Comparar IDs
    console.log('\n🔍 3. Comparação de IDs:')
    const directIds = new Set(directBraiders?.map(b => b.id) || [])
    const viewIds = new Set(viewBraiders?.map(b => b.id) || [])
    
    console.log(`IDs na tabela direta: ${directIds.size}`)
    console.log(`IDs na view: ${viewIds.size}`)
    
    const onlyInDirect = [...directIds].filter(id => !viewIds.has(id))
    const onlyInView = [...viewIds].filter(id => !directIds.has(id))
    
    if (onlyInDirect.length > 0) {
      console.log(`❌ IDs apenas na tabela direta (${onlyInDirect.length}):`, onlyInDirect)
    }
    
    if (onlyInView.length > 0) {
      console.log(`❌ IDs apenas na view (${onlyInView.length}):`, onlyInView)
    }
    
    if (onlyInDirect.length === 0 && onlyInView.length === 0) {
      console.log(`✅ Todos os IDs estão presentes em ambas as fontes`)
    }
    
    // 4. Testar busca individual em ambos
    if (directBraiders && directBraiders.length > 0) {
      const testId = directBraiders[0].id
      console.log(`\n🧪 4. Testando busca individual para ID: ${testId}`)
      
      // Busca direta (como getBraiderById faz)
      const { data: singleDirect, error: singleDirectError } = await supabase
        .from('braiders')
        .select('*')
        .eq('id', testId)
        .single()
        
      if (singleDirectError) {
        console.error('❌ Erro na busca direta individual:', singleDirectError)
      } else {
        console.log('✅ Busca direta individual: sucesso')
        console.log(`   Nome: ${singleDirect.name || 'null'}`)
        console.log(`   Email: ${singleDirect.contact_email || 'null'}`)
      }
      
      // Busca via RPC (como getBraiderWithRealRating faz)
      try {
        const { data: singleRPC, error: singleRPCError } = await supabase
          .rpc('get_braider_with_stats', { braider_uuid: testId })
          .single()
          
        if (singleRPCError) {
          console.error('❌ Erro na busca RPC individual:', singleRPCError)
        } else {
          console.log('✅ Busca RPC individual: sucesso')
          console.log(`   Nome: ${singleRPC.user_name || 'null'}`)
          console.log(`   Email: ${singleRPC.user_email || 'null'}`)
        }
      } catch (rpcError) {
        console.error('❌ RPC function não existe ou erro:', rpcError)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

debugBraiderComparison().then(() => {
  console.log('\n🏁 Comparação concluída')
  process.exit(0)
})
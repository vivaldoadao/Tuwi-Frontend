// Script para debugar os IDs dos braiders
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBraiderIds() {
  try {
    console.log('🔍 Verificando braiders no banco...')
    
    // Buscar todos os braiders
    const { data: braiders, error } = await supabase
      .from('braiders')
      .select('id, name, contact_email, status')
      .limit(10)
    
    if (error) {
      console.error('❌ Erro ao buscar braiders:', error)
      return
    }
    
    console.log(`✅ Encontrados ${braiders?.length || 0} braiders:`)
    
    braiders?.forEach((braider, index) => {
      console.log(`${index + 1}. ID: ${braider.id}`)
      console.log(`   Nome: ${braider.name}`)
      console.log(`   Email: ${braider.contact_email}`) 
      console.log(`   Status: ${braider.status}`)
      console.log(`   Link seria: /braiders/${braider.id}`)
      console.log('   ---')
    })
    
    // Testar busca por ID específico
    if (braiders && braiders.length > 0) {
      const firstBraiderId = braiders[0].id
      console.log(`\n🧪 Testando busca pelo ID: ${firstBraiderId}`)
      
      const { data: singleBraider, error: singleError } = await supabase
        .from('braiders')
        .select('*')
        .eq('id', firstBraiderId)
        .single()
        
      if (singleError) {
        console.error('❌ Erro na busca individual:', singleError)
      } else {
        console.log('✅ Braider encontrado por ID:', {
          id: singleBraider.id,
          name: singleBraider.name,
          found: !!singleBraider
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

debugBraiderIds().then(() => {
  console.log('\n🏁 Debug concluído')
  process.exit(0)
})
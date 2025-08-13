const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRPCFunctions() {
  console.log('🔧 VERIFICANDO FUNÇÕES RPC...\n')

  try {
    // Tentar chamar a função update_user_presence
    console.log('1️⃣ Testando update_user_presence...')
    const { data, error } = await supabase.rpc('update_user_presence', {
      p_user_id: 'test-user-id',
      p_is_online: true,
      p_user_agent: 'Test Agent',
      p_ip_address: '127.0.0.1'
    })

    if (error) {
      console.log('   ❌ Erro:', error.message)
      if (error.message.includes('does not exist')) {
        console.log('   🔧 SOLUÇÃO: Função RPC update_user_presence não existe')
        console.log('   Precisa ser criada ou a API precisa ser simplificada')
      }
    } else {
      console.log('   ✅ Função RPC funcionando!')
      console.log('   📊 Resultado:', data)
    }

  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  // Verificar se tabela user_presence existe
  console.log('\n2️⃣ Verificando tabela user_presence...')
  try {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .limit(1)

    if (error) {
      console.log('   ❌ Erro:', error.message)
      if (error.message.includes('does not exist')) {
        console.log('   🔧 SOLUÇÃO: Tabela user_presence não existe')
        console.log('   Sistema de presença precisa ser criado ou desabilitado')
      }
    } else {
      console.log('   ✅ Tabela user_presence existe!')
      console.log('   📊 Registros:', data?.length || 0)
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 RECOMENDAÇÕES:')
  console.log('1. Desabilitar sistema de presença temporariamente')
  console.log('2. Ou criar tabela user_presence e função RPC')
  console.log('3. Verificar outras APIs que podem estar falhando')
}

checkRPCFunctions()
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS...\n')

  const tablesToCheck = [
    'users', 'promotions', 'promotion_settings', 
    'promotion_analytics', 'promotion_transactions',
    'orders', 'braiders', 'conversations', 'messages',
    'products', 'categories'
  ]

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Verificando tabela: ${tableName}`)
      
      // Tentar fazer uma query limitada para verificar se a tabela existe
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0)

      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✅ ${tableName}: existe (${count || 0} registros)`)
        
        // Se a tabela existe, vamos tentar ver suas colunas fazendo uma query com limit 1
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0])
          const userColumns = columns.filter(col => 
            col.includes('user') || col.includes('_by') || col === 'created_by' || col === 'updated_by'
          )
          if (userColumns.length > 0) {
            console.log(`      🔗 Colunas de usuário: ${userColumns.join(', ')}`)
          }
        } else if (sampleData) {
          console.log('      📝 Tabela vazia, não é possível determinar colunas')
        }
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: Erro inesperado - ${err.message}`)
    }
  }

  // Verificar especificamente a tabela users
  console.log('\n👤 VERIFICAÇÃO ESPECÍFICA DA TABELA USERS:')
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)
    
    if (userError) {
      console.log('❌ Tabela users não encontrada:', userError.message)
    } else {
      console.log('✅ Tabela users existe e está acessível')
      if (userData && userData.length > 0) {
        console.log('   📊 Estrutura detectada:', Object.keys(userData[0]))
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar users:', err.message)
  }
}

checkTables()
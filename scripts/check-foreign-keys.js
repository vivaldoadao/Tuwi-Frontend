const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkForeignKeys() {
  console.log('🔍 ANALISANDO FOREIGN KEYS E ESTRUTURA DAS TABELAS...\n')

  // Lista de tabelas para verificar em detalhes
  const importantTables = [
    'users', 'promotions', 'promotion_settings', 
    'braiders', 'orders', 'conversations', 'messages'
  ]

  for (const tableName of importantTables) {
    try {
      console.log(`\n📋 Tabela: ${tableName}`)
      
      // Obter uma amostra para ver a estrutura
      const { data: sampleData, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`   ❌ Erro: ${error.message}`)
        continue
      }

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0])
        console.log(`   📊 Total de colunas: ${columns.length}`)
        
        // Identificar colunas de usuário
        const userColumns = columns.filter(col => 
          col.includes('user_id') || 
          col === 'user1_id' || 
          col === 'user2_id' ||
          col === 'updated_by' || 
          col === 'created_by' ||
          col === 'approved_by'
        )
        
        if (userColumns.length > 0) {
          console.log(`   🔗 Colunas de FK para usuário: ${userColumns.join(', ')}`)
          
          // Verificar valores de amostra para entender o tipo de ID
          for (const col of userColumns) {
            const sampleValue = sampleData[0][col]
            if (sampleValue) {
              console.log(`      - ${col}: ${sampleValue} (tipo: ${typeof sampleValue})`)
            } else {
              console.log(`      - ${col}: null`)
            }
          }
        } else {
          console.log(`   ℹ️  Nenhuma coluna de usuário detectada`)
        }
        
        // Mostrar estrutura geral da primeira linha
        console.log('   📝 Estrutura completa:')
        Object.keys(sampleData[0]).forEach(key => {
          const value = sampleData[0][key]
          const type = value === null ? 'null' : typeof value
          console.log(`      ${key}: ${type}`)
        })
        
      } else {
        console.log(`   📝 Tabela vazia`)
      }
      
    } catch (err) {
      console.log(`   ❌ Erro inesperado: ${err.message}`)
    }
  }

  // Verificar especificamente a estrutura da tabela users
  console.log('\n\n👤 ANÁLISE DETALHADA DA TABELA USERS:')
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(3)
    
    if (!error && users && users.length > 0) {
      console.log('✅ Primeiros usuários na tabela:')
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`)
      })
      
      console.log('\n📊 Estrutura da tabela users:')
      Object.keys(users[0]).forEach(key => {
        const value = users[0][key]
        const type = value === null ? 'null' : typeof value
        console.log(`   ${key}: ${type}`)
      })
    }
  } catch (err) {
    console.log('❌ Erro ao analisar users:', err.message)
  }
}

checkForeignKeys()
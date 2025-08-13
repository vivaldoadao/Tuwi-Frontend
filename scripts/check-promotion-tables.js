const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPromotionTables() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS DE PROMOÇÃO...\n')

  const tablesToCheck = [
    'promotion_combos',
    'promotion_packages', 
    'promotion_subscriptions',
    'promotion_analytics',
    'promotion_settings'
  ]

  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 Verificando tabela: ${tableName}`)
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✅ ${tableName}: existe (${count || 0} registros)`)
        
        if (data && data.length > 0) {
          const columns = Object.keys(data[0])
          console.log(`      📊 Colunas: ${columns.join(', ')}`)
          
          // Verificar se tem sort_order
          if (columns.includes('sort_order')) {
            console.log('      ✅ Tem coluna sort_order')
          } else {
            console.log('      ❌ NÃO tem coluna sort_order')
          }
        } else {
          console.log('      📝 Tabela vazia - não é possível ver estrutura')
        }
      }
      
    } catch (err) {
      console.log(`   ❌ ${tableName}: Erro inesperado - ${err.message}`)
    }
  }

  console.log('\n🎯 RECOMENDAÇÕES:')
  console.log('1. Adicionar coluna sort_order às tabelas que não têm')
  console.log('2. Verificar se tabelas existem antes de usar nas APIs')
  console.log('3. Criar tabelas em falta se necessário')
}

checkPromotionTables()
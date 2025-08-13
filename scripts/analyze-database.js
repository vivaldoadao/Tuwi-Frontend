const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeDatabase() {
  console.log('🔍 ANALISANDO FOREIGN KEYS ATUAIS...\n')

  try {
    // 1. Verificar FK referenciando auth.users
    console.log('❌ FOREIGN KEYS REFERENCIANDO auth.users (PRECISAM CORREÇÃO):')
    const { data: authFKs, error: authError } = await supabase.rpc('get_foreign_keys_auth_users')
    
    if (authError) {
      console.log('Executando query diretamente...')
      const { data: authFKsData, error } = await supabase
        .from('information_schema.table_constraints')
        .select(`
          table_schema,
          table_name,
          constraint_name
        `)
        .eq('constraint_type', 'FOREIGN KEY')
        
      if (!error && authFKsData) {
        console.log('Encontradas constraints:', authFKsData.length)
      }
    }

    // 2. Verificar tabelas com user_id
    console.log('\n📋 TABELAS COM user_id PARA VERIFICAÇÃO:')
    const { data: userIdColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, is_nullable, data_type')
      .in('column_name', ['user_id', 'updated_by', 'created_by'])
      .eq('table_schema', 'public')
      .order('table_name')

    if (columnsError) {
      console.error('Erro ao buscar colunas:', columnsError)
    } else {
      console.table(userIdColumns)
    }

    // 3. Verificar se as tabelas principais existem
    console.log('\n🏗️ VERIFICANDO TABELAS PRINCIPAIS:')
    const tablesToCheck = [
      'users', 'promotions', 'promotion_settings', 
      'promotion_analytics', 'promotion_transactions',
      'orders', 'braiders', 'conversations', 'messages'
    ]
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .single()
      
      if (data) {
        console.log(`✅ ${table} - existe`)
      } else {
        console.log(`❌ ${table} - não existe`)
      }
    }

  } catch (error) {
    console.error('Erro na análise:', error)
  }
}

analyzeDatabase()
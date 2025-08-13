const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function performMigration() {
  console.log('🚀 EXECUTANDO MIGRAÇÃO FINAL DE FOREIGN KEYS...\n')
  
  // Como o Supabase não permite DDL diretamente via JS SDK,
  // vamos verificar se as constraints já existem e imprimir SQL para execução manual
  
  const foreignKeys = [
    { table: 'promotions', column: 'user_id', constraint: 'promotions_user_id_fkey', onDelete: 'CASCADE' },
    { table: 'promotions', column: 'approved_by', constraint: 'promotions_approved_by_fkey', onDelete: 'SET NULL' },
    { table: 'braiders', column: 'user_id', constraint: 'braiders_user_id_fkey', onDelete: 'CASCADE' },
    { table: 'conversations', column: 'participant_1_id', constraint: 'conversations_participant_1_id_fkey', onDelete: 'CASCADE' },
    { table: 'conversations', column: 'participant_2_id', constraint: 'conversations_participant_2_id_fkey', onDelete: 'CASCADE' },
    { table: 'conversations', column: 'last_message_sender_id', constraint: 'conversations_last_message_sender_id_fkey', onDelete: 'SET NULL' },
    { table: 'messages', column: 'sender_id', constraint: 'messages_sender_id_fkey', onDelete: 'CASCADE' },
    { table: 'promotion_settings', column: 'updated_by', constraint: 'promotion_settings_updated_by_fkey', onDelete: 'SET NULL' }
  ]

  console.log('📋 VALIDANDO DADOS ANTES DA MIGRAÇÃO...\n')
  
  let allDataValid = true
  
  for (const fk of foreignKeys) {
    try {
      console.log(`🔍 Verificando ${fk.table}.${fk.column}...`)
      
      // Buscar registros com valores não-nulos nesta coluna
      const { data, error } = await supabase
        .from(fk.table)
        .select(`${fk.column}`)
        .not(fk.column, 'is', null)
      
      if (error) {
        console.log(`   ❌ Erro ao verificar: ${error.message}`)
        continue
      }

      if (data && data.length > 0) {
        // Verificar se todos os valores referenciam users válidos
        const userIds = [...new Set(data.map(row => row[fk.column]))]
        console.log(`   📊 Encontrados ${data.length} registros, ${userIds.length} user IDs únicos`)
        
        // Verificar se todos esses user IDs existem na tabela users
        const { data: existingUsers, error: userError } = await supabase
          .from('users')
          .select('id')
          .in('id', userIds)
        
        if (userError) {
          console.log(`   ❌ Erro ao verificar users: ${userError.message}`)
          allDataValid = false
          continue
        }
        
        const existingUserIds = existingUsers.map(u => u.id)
        const missingUserIds = userIds.filter(id => !existingUserIds.includes(id))
        
        if (missingUserIds.length > 0) {
          console.log(`   ❌ ATENÇÃO: ${missingUserIds.length} user IDs não existem:`)
          missingUserIds.slice(0, 3).forEach(id => console.log(`      - ${id}`))
          if (missingUserIds.length > 3) {
            console.log(`      ... e mais ${missingUserIds.length - 3}`)
          }
          allDataValid = false
        } else {
          console.log(`   ✅ Todos os user IDs são válidos`)
        }
      } else {
        console.log(`   ℹ️  Nenhum registro com ${fk.column} não-nulo`)
      }
      
    } catch (err) {
      console.log(`   ❌ Erro inesperado: ${err.message}`)
      allDataValid = false
    }
  }
  
  console.log('\n' + '='.repeat(60))
  if (allDataValid) {
    console.log('✅ VALIDAÇÃO CONCLUÍDA: Todos os dados são válidos para migração!')
    
    console.log('\n📋 SQL PARA EXECUTAR MANUALMENTE NO SUPABASE:')
    console.log('-- Copie e cole no SQL Editor do Supabase Dashboard\n')
    
    foreignKeys.forEach(fk => {
      console.log(`-- ${fk.table}.${fk.column}`)
      console.log(`ALTER TABLE public.${fk.table} DROP CONSTRAINT IF EXISTS ${fk.constraint};`)
      console.log(`ALTER TABLE public.${fk.table} ADD CONSTRAINT ${fk.constraint}`)
      console.log(`  FOREIGN KEY (${fk.column}) REFERENCES public.users(id) ON DELETE ${fk.onDelete};`)
      console.log('')
    })
    
    console.log('-- Verificar resultado:')
    console.log(`SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;`)

  } else {
    console.log('❌ VALIDAÇÃO FALHADA: Existem dados inconsistentes!')
    console.log('   É necessário corrigir os dados antes de executar a migração.')
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:')
  console.log('1. Execute o SQL acima no Supabase Dashboard → SQL Editor')
  console.log('2. Verifique se todas as constraints foram criadas corretamente')
  console.log('3. Teste as funcionalidades do sistema para garantir que tudo funciona')
}

if (require.main === module) {
  performMigration().catch(console.error)
}
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
)

async function safeMigrateForeignKeys() {
  console.log('🚀 INICIANDO MIGRAÇÃO SEGURA DE FOREIGN KEYS...\n')

  const migrations = [
    {
      table: 'promotions',
      columns: [
        { name: 'user_id', onDelete: 'CASCADE' },
        { name: 'approved_by', onDelete: 'SET NULL', nullable: true }
      ]
    },
    {
      table: 'braiders', 
      columns: [
        { name: 'user_id', onDelete: 'CASCADE' }
      ]
    },
    {
      table: 'conversations',
      columns: [
        { name: 'participant_1_id', constraintName: 'conversations_participant_1_fkey', onDelete: 'CASCADE' },
        { name: 'participant_2_id', constraintName: 'conversations_participant_2_fkey', onDelete: 'CASCADE' },
        { name: 'last_message_sender_id', constraintName: 'conversations_sender_fkey', onDelete: 'SET NULL', nullable: true }
      ]
    },
    {
      table: 'messages',
      columns: [
        { name: 'sender_id', onDelete: 'CASCADE' }
      ]
    },
    {
      table: 'promotion_settings',
      columns: [
        { name: 'updated_by', onDelete: 'SET NULL', nullable: true }
      ]
    }
  ]

  let totalUpdated = 0
  let totalErrors = 0

  for (const migration of migrations) {
    console.log(`\n📋 Processando tabela: ${migration.table}`)
    
    for (const column of migration.columns) {
      const constraintName = column.constraintName || `${migration.table}_${column.name}_fkey`
      const onDelete = column.onDelete || 'CASCADE'
      
      try {
        console.log(`   🔧 Processando coluna: ${column.name}`)
        
        // Primeiro, tentar remover constraint existente (se existir)
        try {
          const dropQuery = `ALTER TABLE public.${migration.table} DROP CONSTRAINT IF EXISTS ${constraintName}`
          const { error: dropError } = await supabase.rpc('execute_sql', { 
            query: dropQuery 
          })
          
          if (!dropError) {
            console.log(`      ↳ Constraint antiga removida (se existia)`)
          }
        } catch (dropErr) {
          // Ignorar erros de drop - constraint pode não existir
          console.log(`      ↳ Constraint não existia anteriormente`)
        }

        // Adicionar nova constraint para public.users
        const addQuery = `ALTER TABLE public.${migration.table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${column.name}) REFERENCES public.users(id) ON DELETE ${onDelete}`
        
        const { error: addError } = await supabase.rpc('execute_sql', { 
          query: addQuery 
        })
        
        if (addError) {
          console.log(`      ❌ Erro ao adicionar FK: ${addError.message}`)
          totalErrors++
        } else {
          console.log(`      ✅ FK adicionada: ${column.name} -> public.users (${onDelete})`)
          totalUpdated++
        }
        
      } catch (err) {
        console.log(`      ❌ Erro inesperado: ${err.message}`)
        totalErrors++
      }
    }
  }

  console.log(`\n📊 RESUMO DA MIGRAÇÃO:`)
  console.log(`   ✅ Foreign Keys atualizadas: ${totalUpdated}`)
  console.log(`   ❌ Erros encontrados: ${totalErrors}`)
  
  if (totalErrors === 0) {
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('   O sistema continua funcionando normalmente.')
  } else {
    console.log('\n⚠️  MIGRAÇÃO PARCIALMENTE CONCLUÍDA')
    console.log('   Algumas FKs podem precisar de correção manual.')
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  safeMigrateForeignKeys().catch(console.error)
}

module.exports = { safeMigrateForeignKeys }
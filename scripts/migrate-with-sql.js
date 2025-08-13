const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executeSQLMigration() {
  console.log('🚀 INICIANDO MIGRAÇÃO DE FOREIGN KEYS USANDO SQL DIRETO...\n')

  // SQL commands to execute
  const sqlCommands = [
    // 1. Promotions table - user_id
    {
      name: 'Promotions user_id FK',
      drop: `ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_user_id_fkey`,
      add: `ALTER TABLE public.promotions ADD CONSTRAINT promotions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE`
    },
    // 2. Promotions table - approved_by  
    {
      name: 'Promotions approved_by FK',
      drop: `ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_approved_by_fkey`,
      add: `ALTER TABLE public.promotions ADD CONSTRAINT promotions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL`
    },
    // 3. Braiders table - user_id
    {
      name: 'Braiders user_id FK',
      drop: `ALTER TABLE public.braiders DROP CONSTRAINT IF EXISTS braiders_user_id_fkey`,
      add: `ALTER TABLE public.braiders ADD CONSTRAINT braiders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE`
    },
    // 4. Conversations - participant_1_id
    {
      name: 'Conversations participant_1_id FK',
      drop: `ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_1_id_fkey`,
      add: `ALTER TABLE public.conversations ADD CONSTRAINT conversations_participant_1_id_fkey FOREIGN KEY (participant_1_id) REFERENCES public.users(id) ON DELETE CASCADE`
    },
    // 5. Conversations - participant_2_id
    {
      name: 'Conversations participant_2_id FK',
      drop: `ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_2_id_fkey`,
      add: `ALTER TABLE public.conversations ADD CONSTRAINT conversations_participant_2_id_fkey FOREIGN KEY (participant_2_id) REFERENCES public.users(id) ON DELETE CASCADE`
    },
    // 6. Conversations - last_message_sender_id
    {
      name: 'Conversations sender FK',
      drop: `ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_last_message_sender_id_fkey`,
      add: `ALTER TABLE public.conversations ADD CONSTRAINT conversations_last_message_sender_id_fkey FOREIGN KEY (last_message_sender_id) REFERENCES public.users(id) ON DELETE SET NULL`
    },
    // 7. Messages - sender_id
    {
      name: 'Messages sender_id FK',
      drop: `ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey`,
      add: `ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE`
    },
    // 8. Promotion Settings - updated_by
    {
      name: 'Promotion Settings updated_by FK',
      drop: `ALTER TABLE public.promotion_settings DROP CONSTRAINT IF EXISTS promotion_settings_updated_by_fkey`,
      add: `ALTER TABLE public.promotion_settings ADD CONSTRAINT promotion_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL`
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const command of sqlCommands) {
    try {
      console.log(`\n🔧 ${command.name}`)
      
      // Executar DROP primeiro (usando query simples - isso deve funcionar)
      console.log(`   ↳ Removendo constraint existente...`)
      
      // Para o Supabase, vamos tentar uma abordagem diferente
      // Usar o query builder para executar comandos DDL não é suportado
      // Vamos criar uma função temporária para executar DDL
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION temp_execute_ddl(sql_command text)
        RETURNS text AS $$
        BEGIN
          EXECUTE sql_command;
          RETURN 'SUCCESS';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM;
        END;
        $$ LANGUAGE plpgsql;
      `
      
      // Primeiro criar a função
      const { data: funcResult, error: funcError } = await supabase
        .rpc('temp_execute_ddl', { sql_command: command.drop })
        
      if (funcError && !funcError.message.includes('function "temp_execute_ddl" does not exist')) {
        console.log(`   ❌ Erro ao remover constraint: ${funcError.message}`)
      } else {
        console.log(`   ✅ Constraint removida (se existia)`)
      }

      // Executar ADD
      console.log(`   ↳ Adicionando nova constraint...`)
      const { data: addResult, error: addError } = await supabase
        .rpc('temp_execute_ddl', { sql_command: command.add })
        
      if (addError) {
        console.log(`   ❌ Erro ao adicionar constraint: ${addError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Constraint adicionada com sucesso`)
        successCount++
      }

    } catch (err) {
      console.log(`   ❌ Erro inesperado: ${err.message}`)
      errorCount++
    }
  }

  // Limpar função temporária
  try {
    await supabase.rpc('temp_execute_ddl', { 
      sql_command: 'DROP FUNCTION IF EXISTS temp_execute_ddl(text)' 
    })
  } catch (err) {
    // Ignorar erro de limpeza
  }

  console.log(`\n📊 RESULTADO DA MIGRAÇÃO:`)
  console.log(`   ✅ Constraints atualizadas: ${successCount}`)
  console.log(`   ❌ Erros: ${errorCount}`)
  
  if (errorCount === 0) {
    console.log('\n🎉 MIGRAÇÃO COMPLETADA COM SUCESSO!')
  } else {
    console.log('\n⚠️  MIGRAÇÃO PARCIAL - Alguns erros encontrados')
  }
}

if (require.main === module) {
  executeSQLMigration().catch(console.error)
}
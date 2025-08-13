const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeRLSPolicies() {
  console.log('🔒 ANALISANDO POLÍTICAS RLS ATUAIS...\n')

  const criticalTables = [
    'users', 'promotions', 'braiders', 'conversations', 
    'messages', 'orders', 'products', 'promotion_settings'
  ]

  for (const tableName of criticalTables) {
    try {
      console.log(`\n📋 Analisando tabela: ${tableName}`)
      
      // Verificar se RLS está habilitado
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .eq('relname', tableName)
        .single()
      
      if (rlsError || !rlsStatus) {
        console.log('   ❓ Não foi possível verificar status RLS via API')
      } else {
        const hasRLS = rlsStatus.relrowsecurity
        console.log(`   🔒 RLS: ${hasRLS ? '✅ HABILITADO' : '❌ DESABILITADO'}`)
      }

      // Tentar fazer uma consulta para ver se há acesso
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log('   🚫 BLOQUEADO por RLS (esperado para algumas tabelas)')
        } else {
          console.log(`   ❌ ERRO: ${error.message}`)
        }
      } else {
        console.log(`   ✅ ACESSÍVEL: ${count || 0} registros encontrados`)
      }

      // Verificar alguns campos importantes para segurança
      if (data && data.length > 0) {
        const sampleRecord = data[0]
        const sensitiveFields = ['password_hash', 'email', 'phone', 'address']
        const foundSensitive = sensitiveFields.filter(field => field in sampleRecord)
        
        if (foundSensitive.length > 0) {
          console.log(`   ⚠️  CAMPOS SENSÍVEIS: ${foundSensitive.join(', ')}`)
        }
      }

    } catch (err) {
      console.log(`   ❌ Erro inesperado: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 RECOMENDAÇÕES DE SEGURANÇA RLS:')
  
  const recommendations = [
    {
      table: 'users',
      policy: 'Usuários só podem ver/editar seus próprios dados',
      sql: `-- Users: acesso aos próprios dados
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON public.users
FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "users_public_read" ON public.users  
FOR SELECT USING (true); -- Para exibir nomes em listas públicas`
    },
    {
      table: 'promotions', 
      policy: 'Usuários só podem gerenciar suas próprias promoções',
      sql: `-- Promotions: usuários gerenciam suas promoções
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_owner" ON public.promotions
FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "promotions_public_read" ON public.promotions
FOR SELECT USING (status = 'active'); -- Promoções ativas são públicas`
    },
    {
      table: 'conversations',
      policy: 'Usuários só veem conversas que participam',  
      sql: `-- Conversations: acesso apenas aos participantes
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_participants" ON public.conversations
FOR ALL USING (
  auth.uid()::text = participant_1_id OR 
  auth.uid()::text = participant_2_id
);`
    },
    {
      table: 'messages',
      policy: 'Mensagens apenas para participantes da conversa',
      sql: `-- Messages: através da conversa
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_via_conversation" ON public.messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1_id = auth.uid()::text 
         OR conversations.participant_2_id = auth.uid()::text)
  )
);`
    }
  ]

  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.table.toUpperCase()}`)
    console.log(`   ${rec.policy}`)
  })

  console.log('\n🎯 PRÓXIMO PASSO:')
  console.log('Execute as políticas RLS no Supabase Dashboard para aumentar a segurança.')
}

if (require.main === module) {
  analyzeRLSPolicies().catch(console.error)
}
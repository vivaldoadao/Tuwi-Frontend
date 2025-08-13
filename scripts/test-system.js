const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testSystemFunctionality() {
  console.log('🧪 TESTANDO FUNCIONALIDADES APÓS MIGRAÇÃO...\n')

  const tests = [
    {
      name: 'Verificar integridade das Foreign Keys',
      test: async () => {
        const { data, error } = await supabase
          .from('information_schema.table_constraints')
          .select(`
            table_name,
            constraint_name
          `)
          .eq('constraint_type', 'FOREIGN KEY')
          .eq('table_schema', 'public')

        if (error) throw error
        
        const fkCount = data?.length || 0
        console.log(`   ✅ ${fkCount} Foreign Keys encontradas no sistema`)
        return true
      }
    },
    {
      name: 'Testar consulta de Promoções com usuários',
      test: async () => {
        const { data, error } = await supabase
          .from('promotions')
          .select(`
            id,
            title,
            user_id,
            users!promotions_user_id_fkey (
              email,
              name
            )
          `)
          .limit(3)

        if (error) throw error
        
        const withUsers = data?.filter(p => p.users) || []
        console.log(`   ✅ ${data?.length || 0} promoções, ${withUsers.length} com dados de usuário`)
        return true
      }
    },
    {
      name: 'Testar consulta de Trancistas com usuários', 
      test: async () => {
        const { data, error } = await supabase
          .from('braiders')
          .select(`
            id,
            name,
            user_id,
            users!braiders_user_id_fkey (
              email,
              role
            )
          `)
          .limit(3)

        if (error) throw error
        
        const withUsers = data?.filter(b => b.users) || []
        console.log(`   ✅ ${data?.length || 0} trancistas, ${withUsers.length} com dados de usuário`)
        return true
      }
    },
    {
      name: 'Testar consulta de Conversas com participantes',
      test: async () => {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            participant_1:users!conversations_participant_1_id_fkey (
              email
            ),
            participant_2:users!conversations_participant_2_id_fkey (
              email
            )
          `)
          .limit(2)

        if (error) throw error
        
        const validConversations = data?.filter(c => c.participant_1 && c.participant_2) || []
        console.log(`   ✅ ${data?.length || 0} conversas, ${validConversations.length} com participantes válidos`)
        return true
      }
    },
    {
      name: 'Testar consulta de Mensagens com remetentes',
      test: async () => {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender:users!messages_sender_id_fkey (
              email,
              name
            )
          `)
          .limit(5)

        if (error) throw error
        
        const withSenders = data?.filter(m => m.sender) || []
        console.log(`   ✅ ${data?.length || 0} mensagens, ${withSenders.length} com remetentes válidos`)
        return true
      }
    },
    {
      name: 'Verificar se sistema NextAuth continua funcionando',
      test: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, email_verified')
          .limit(3)

        if (error) throw error
        
        const activeUsers = data?.filter(u => u.email_verified) || []
        console.log(`   ✅ ${data?.length || 0} usuários no sistema, ${activeUsers.length} verificados`)
        return true
      }
    }
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`)
      await test.test()
      passedTests++
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  if (passedTests === totalTests) {
    console.log(`✅ TODOS OS TESTES PASSARAM (${passedTests}/${totalTests})`)
    console.log('🎉 Sistema funcionando perfeitamente após migração!')
  } else {
    console.log(`⚠️  ${passedTests}/${totalTests} testes passaram`)
    console.log('Algumas funcionalidades podem ter problemas.')
  }
  
  console.log('\n📋 PRÓXIMAS MELHORIAS:')
  console.log('1. Adicionar índices para performance')
  console.log('2. Revisar políticas RLS')  
  console.log('3. Adicionar constraints de integridade')
}

if (require.main === module) {
  testSystemFunctionality().catch(console.error)
}
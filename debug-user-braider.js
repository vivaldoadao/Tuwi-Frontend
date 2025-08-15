// Script para debuggar o problema específico do usuário
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugUserBraider() {
  console.log('🔍 DEBUGANDO PROBLEMA DO USUÁRIO BRAIDER...\n')
  
  try {
    // 1. Verificar usuários com role braider
    console.log('1️⃣ Buscando usuários com role braider...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }

    const braiderUsers = users.users.filter(user => 
      user.user_metadata?.role === 'braider' || 
      user.app_metadata?.role === 'braider'
    )
    
    console.log(`📊 Encontrados ${braiderUsers.length} usuários com role braider:`)
    braiderUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
      console.log(`     Role em user_metadata: ${user.user_metadata?.role}`)
      console.log(`     Role em app_metadata: ${user.app_metadata?.role}`)
    })
    
    console.log('\n2️⃣ Verificando registros na tabela braiders...')
    
    // 2. Para cada usuário braider, verificar se tem registro na tabela braiders
    for (const user of braiderUsers) {
      console.log(`\n🔍 Verificando ${user.email}...`)
      
      const { data: braiderRecord, error: braiderError } = await supabase
        .from('braiders')
        .select('id, user_id, name, contact_email, status, created_at')
        .eq('user_id', user.id)
        .single()
      
      if (braiderError) {
        if (braiderError.code === 'PGRST116') {
          console.log(`   ❌ PROBLEMA: Não há registro na tabela braiders para ${user.email}`)
          console.log(`   💡 Solução: Usuário precisa completar registro via /register-braider`)
        } else {
          console.log(`   ❌ Erro ao buscar registro:`, braiderError)
        }
      } else {
        console.log(`   ✅ Registro encontrado:`)
        console.log(`      ID: ${braiderRecord.id}`)
        console.log(`      Nome: ${braiderRecord.name}`)
        console.log(`      Email: ${braiderRecord.contact_email}`)
        console.log(`      Status: ${braiderRecord.status}`)
        console.log(`      Criado em: ${braiderRecord.created_at}`)
      }
    }
    
    console.log('\n3️⃣ Verificando todos os registros na tabela braiders...')
    
    // 3. Listar todos os registros da tabela braiders
    const { data: allBraiders, error: allBraidersError } = await supabase
      .from('braiders')
      .select('id, user_id, name, contact_email, status, created_at')
      .order('created_at', { ascending: false })
    
    if (allBraidersError) {
      console.error('❌ Erro ao buscar braiders:', allBraidersError)
    } else {
      console.log(`📊 Total de registros na tabela braiders: ${allBraiders.length}`)
      allBraiders.forEach(braider => {
        console.log(`   - ${braider.name} (${braider.contact_email}) - Status: ${braider.status}`)
        console.log(`     User ID: ${braider.user_id}`)
      })
    }
    
    console.log('\n4️⃣ RESUMO DO DIAGNÓSTICO:')
    
    const usersWithRole = braiderUsers.length
    const usersWithRecord = allBraiders?.length || 0
    const mismatch = usersWithRole - usersWithRecord
    
    console.log(`   👥 Usuários com role 'braider': ${usersWithRole}`)
    console.log(`   📋 Registros na tabela braiders: ${usersWithRecord}`)
    
    if (mismatch > 0) {
      console.log(`   ⚠️  PROBLEMA: ${mismatch} usuário(s) com role 'braider' sem registro na tabela`)
      console.log(`   💡 SOLUÇÃO: Estes usuários precisam completar o registro via /register-braider`)
    } else {
      console.log(`   ✅ Todos os usuários braider têm registros correspondentes`)
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar
debugUserBraider()
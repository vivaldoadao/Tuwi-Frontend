const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseFixes() {
  console.log('🧪 TESTANDO CORREÇÕES DO BANCO DE DADOS...\n')

  // 1. Testar se sort_order foi adicionado
  console.log('1️⃣ Testando promotion_combos.sort_order...')
  try {
    const { data, error } = await supabase
      .from('promotion_combos')
      .select('id, name, sort_order')
      .limit(3)
    
    if (error) {
      console.log('   ❌ Erro:', error.message)
      if (error.message.includes('sort_order does not exist')) {
        console.log('   🔧 SOLUÇÃO: Execute FIX-PROMOTION-TABLES-CORRECTED.sql')
      }
    } else {
      console.log('   ✅ sort_order funcionando!')
      console.log('   📊 Amostra:', data.map(d => ({ name: d.name, sort_order: d.sort_order })))
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  // 2. Testar consulta de promoções com relação específica
  console.log('\n2️⃣ Testando relação promotions -> users...')
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        id,
        title,
        users!promotions_user_id_fkey(email, name)
      `)
      .limit(2)
    
    if (error) {
      console.log('   ❌ Erro:', error.message)
      if (error.message.includes('more than one relationship')) {
        console.log('   🔧 SOLUÇÃO: API ainda precisa ser atualizada com !promotions_user_id_fkey')
      }
    } else {
      console.log('   ✅ Relação FK funcionando!')
      console.log('   📊 Amostra:', data.map(d => ({ title: d.title, user: d.users?.email })))
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  // 3. Testar política RLS de users
  console.log('\n3️⃣ Testando política RLS users...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(2)
    
    if (error) {
      console.log('   ❌ Erro:', error.message)
      if (error.message.includes('infinite recursion')) {
        console.log('   🔧 SOLUÇÃO: Execute FIX-RLS-RECURSION.sql')
      }
    } else {
      console.log('   ✅ RLS users funcionando!')
      console.log('   📊 Usuários encontrados:', data.length)
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  // 4. Testar braiders
  console.log('\n4️⃣ Testando política RLS braiders...')
  try {
    const { data, error } = await supabase
      .from('braiders')
      .select('id, name, status')
      .eq('status', 'approved')
      .limit(2)
    
    if (error) {
      console.log('   ❌ Erro:', error.message)
    } else {
      console.log('   ✅ RLS braiders funcionando!')
      console.log('   📊 Trancistas encontrados:', data.length)
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  // 5. Testar products
  console.log('\n5️⃣ Testando política RLS products...')
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(2)
    
    if (error) {
      console.log('   ❌ Erro:', error.message)
    } else {
      console.log('   ✅ RLS products funcionando!')
      console.log('   📊 Produtos encontrados:', data.length)
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 PRÓXIMOS PASSOS:')
  console.log('1. Se houver erros acima, execute os scripts SQL correspondentes')
  console.log('2. Teste novamente após cada correção')
  console.log('3. Verifique se o frontend para de dar erros')
}

testDatabaseFixes()
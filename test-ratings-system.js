#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRatingsSystem() {
  try {
    console.log('🧪 Testando sistema de ratings...')
    
    // Test 1: Check if ratings table exists
    console.log('\n1. Verificando tabela ratings...')
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .limit(1)
    
    if (ratingsError) {
      console.log('❌ Tabela ratings:', ratingsError.message)
    } else {
      console.log('✅ Tabela ratings existe')
    }
    
    // Test 2: Check if view exists
    console.log('\n2. Verificando view braiders_with_stats...')
    const { data: viewData, error: viewError } = await supabase
      .from('braiders_with_stats')
      .select('*')
      .limit(1)
    
    if (viewError) {
      console.log('❌ View braiders_with_stats:', viewError.message)
    } else {
      console.log('✅ View braiders_with_stats existe')
    }
    
    // Test 3: Check if function exists
    console.log('\n3. Verificando função get_braider_with_stats...')
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_braider_with_stats', { braider_uuid: '00000000-0000-0000-0000-000000000000' })
    
    if (functionError) {
      console.log('❌ Função get_braider_with_stats:', functionError.message)
    } else {
      console.log('✅ Função get_braider_with_stats existe')
    }
    
    // Test 4: Get braiders with legacy method
    console.log('\n4. Verificando braiders existentes...')
    const { data: braidersData, error: braidersError } = await supabase
      .from('braiders')
      .select('*')
      .limit(5)
    
    if (braidersError) {
      console.log('❌ Erro ao buscar braiders:', braidersError.message)
    } else {
      console.log(`✅ Encontrados ${braidersData?.length || 0} braiders`)
      if (braidersData && braidersData.length > 0) {
        console.log('   Primeiro braider:', {
          id: braidersData[0].id,
          user_name: braidersData[0].user_name,
          status: braidersData[0].status
        })
      }
    }
    
    console.log('\n🏁 Teste concluído!')
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

// Execute if called directly
if (require.main === module) {
  testRatingsSystem().then(() => {
    process.exit(0)
  })
}

module.exports = testRatingsSystem
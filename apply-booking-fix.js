#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyBookingFix() {
  try {
    console.log('🔧 Aplicando fix do booking_type...')
    
    // Read the SQL fix file
    const sqlContent = fs.readFileSync('./fix-atomic-booking-v4.sql', 'utf8')
    
    // Execute the SQL using rpc call
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent })
    
    if (error) {
      console.error('❌ Erro ao aplicar fix:', error)
      return false
    }
    
    console.log('✅ Fix aplicado com sucesso!')
    console.log('📋 Resultado:', data)
    return true
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return false
  }
}

// Execute if called directly
if (require.main === module) {
  applyBookingFix().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = applyBookingFix
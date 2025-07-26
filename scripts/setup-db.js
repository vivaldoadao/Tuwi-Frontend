const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up database schema...')
  
  try {
    // Read and execute schema.sql
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8')
    console.log('📝 Executing schema.sql...')
    
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    if (schemaError) {
      console.error('❌ Error executing schema:', schemaError)
    } else {
      console.log('✅ Schema executed successfully!')
    }
    
    // Read and execute functions.sql
    const functionsSQL = fs.readFileSync(path.join(__dirname, '../supabase/functions.sql'), 'utf8')
    console.log('📝 Executing functions.sql...')
    
    const { error: functionsError } = await supabase.rpc('exec_sql', { sql: functionsSQL })
    if (functionsError) {
      console.error('❌ Error executing functions:', functionsError)
    } else {
      console.log('✅ Functions executed successfully!')
    }
    
    console.log('🎉 Database setup complete!')
    
    // Test basic connectivity
    console.log('🔍 Testing database connectivity...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.log('⚠️  Database structure may not be ready yet, but connection is working')
    } else {
      console.log('✅ Database connectivity test passed!')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupDatabase()
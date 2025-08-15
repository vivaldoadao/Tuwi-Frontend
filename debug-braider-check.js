const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugBraiderCheck() {
  const testEmail = 'znattechnology95@gmail.com'
  
  console.log('🔍 Debug: Checking braider with email:', testEmail)
  
  try {
    // 1. Check if contact_email column exists
    console.log('\n1. Checking table structure...')
    const { data: columns, error: columnError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'braiders' 
          AND column_name IN ('contact_email', 'user_id', 'status')
          ORDER BY column_name;
        `
      })
    
    if (columnError) {
      console.error('Error checking columns:', columnError)
    } else {
      console.log('Table columns:', columns)
    }

    // 2. Check all braiders with this email (case insensitive)
    console.log('\n2. Checking for existing braiders with this email...')
    const { data: braiders, error: braidersError } = await supabase
      .from('braiders')
      .select('id, contact_email, status, created_at')
      .or(`contact_email.eq.${testEmail},contact_email.ilike.${testEmail}`)
    
    if (braidersError) {
      console.error('❌ Error checking braiders:', braidersError)
    } else {
      console.log('📊 Found braiders:', braiders)
      if (braiders && braiders.length > 0) {
        braiders.forEach((braider, i) => {
          console.log(`  ${i + 1}. ID: ${braider.id}`)
          console.log(`     Email: "${braider.contact_email}"`)
          console.log(`     Status: ${braider.status}`)
          console.log(`     Created: ${braider.created_at}`)
        })
      } else {
        console.log('  No braiders found with this email')
      }
    }

    // 3. Test the exact query from the API
    console.log('\n3. Testing exact API query...')
    const { data: exactQuery, error: exactError } = await supabase
      .from('braiders')
      .select('id, status, contact_email')
      .eq('contact_email', testEmail)
      .single()

    if (exactError) {
      console.log('❌ Exact query error:', exactError.message)
      console.log('   Error code:', exactError.code)
    } else {
      console.log('✅ Exact query result:', exactQuery)
    }

    // 4. Check with different case variations
    console.log('\n4. Testing case variations...')
    const variations = [
      testEmail.toLowerCase(),
      testEmail.toUpperCase(),
      testEmail.trim().toLowerCase()
    ]
    
    for (const variation of variations) {
      const { data, error } = await supabase
        .from('braiders')
        .select('id, contact_email, status')
        .eq('contact_email', variation)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.log(`   ${variation}: Error - ${error.message}`)
      } else if (data) {
        console.log(`   ${variation}: Found - ${data.status}`)
      } else {
        console.log(`   ${variation}: Not found`)
      }
    }

    // 5. Count total braiders
    console.log('\n5. Total braiders in database...')
    const { count, error: countError } = await supabase
      .from('braiders')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error counting braiders:', countError)
    } else {
      console.log(`Total braiders: ${count}`)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugBraiderCheck()
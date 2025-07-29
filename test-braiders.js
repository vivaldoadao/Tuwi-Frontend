// Test script to check braiders data
const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBraiders() {
  console.log('Testing braiders data...')
  
  try {
    // Test 1: Check if braiders table exists and has data
    const { data: braiders, error: braidersError, count } = await supabase
      .from('braiders')
      .select('*', { count: 'exact' })
      .limit(5)

    console.log('Braiders query result:')
    console.log('Error:', braidersError)
    console.log('Count:', count)
    console.log('Data:', braiders)

    if (braiders && braiders.length > 0) {
      console.log('\nFirst braider:', braiders[0])
      
      // Test 2: Check users table for the first braider
      const userId = braiders[0].user_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      console.log('\nUser data for first braider:')
      console.log('User Error:', userError)
      console.log('User Data:', userData)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testBraiders()
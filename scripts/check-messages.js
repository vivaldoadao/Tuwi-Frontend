const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkMessagesConsistency() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, is_read, read_at, is_edited, edited_at')
    .limit(10)
    
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('Messages data sample:')
  let violations = []
  data.forEach((msg, i) => {
    console.log(`${i+1}. is_read: ${msg.is_read}, read_at: ${msg.read_at}`)
    console.log(`   is_edited: ${msg.is_edited}, edited_at: ${msg.edited_at}`)
    
    if (msg.is_read === true && msg.read_at === null) {
      console.log('   ❌ VIOLATION: is_read=true but read_at=null')
      violations.push('read_consistency')
    }
    if (msg.is_edited === true && msg.edited_at === null) {
      console.log('   ❌ VIOLATION: is_edited=true but edited_at=null')
      violations.push('edit_consistency')
    }
  })
  
  if (violations.length === 0) {
    console.log('✅ No violations found in sample')
  } else {
    console.log(`❌ Found ${violations.length} constraint violations`)
  }
}

checkMessagesConsistency()
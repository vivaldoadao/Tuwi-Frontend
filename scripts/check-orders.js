const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkOrderNumbers() {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number')
    .limit(10)
    
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('Order numbers format:')
  let violations = 0
  data.forEach((order, i) => {
    console.log(`${i+1}. "${order.order_number}"`)
    const matches = order.order_number.match(/^ORD-[0-9]{8}$/)
    if (!matches) {
      console.log('   ❌ Does NOT match ORD-[0-9]{8} pattern')
      violations++
    } else {
      console.log('   ✅ Matches expected pattern')
    }
  })
  
  if (violations > 0) {
    console.log(`❌ Found ${violations} order number format violations`)
  } else {
    console.log('✅ All order numbers match expected format')
  }
}

checkOrderNumbers()
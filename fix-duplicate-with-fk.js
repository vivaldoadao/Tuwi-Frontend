const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDuplicateWithForeignKey() {
  const email = 'znattechnology95@gmail.com'
  
  console.log('🔧 Fixing duplicate braiders with foreign key constraints...')
  
  try {
    // 1. Get the duplicate braiders
    const { data: duplicates, error: fetchError } = await supabase
      .from('braiders')
      .select('id, status, created_at')
      .eq('contact_email', email)
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('❌ Error fetching duplicates:', fetchError)
      return
    }

    console.log('📊 Duplicate braiders:')
    duplicates.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.status} (${b.created_at}) - ID: ${b.id}`)
    })

    if (duplicates.length <= 1) {
      console.log('✅ No duplicates to fix!')
      return
    }

    // 2. Check foreign key dependencies for each braider
    console.log('\n🔍 Checking foreign key dependencies...')
    
    for (const braider of duplicates) {
      console.log(`\nChecking braider ${braider.id} (${braider.status}):`)
      
      // Check bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, created_at')
        .eq('braider_id', braider.id)
      
      if (bookingsError) {
        console.error(`  ❌ Error checking bookings: ${bookingsError.message}`)
      } else {
        console.log(`  📅 Bookings: ${bookings.length}`)
        bookings.forEach(booking => {
          console.log(`    - ${booking.status} (${booking.created_at})`)
        })
      }
      
      // Check services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .eq('braider_id', braider.id)
      
      if (servicesError) {
        console.error(`  ❌ Error checking services: ${servicesError.message}`)
      } else {
        console.log(`  🛠️ Services: ${services.length}`)
        services.forEach(service => {
          console.log(`    - ${service.name}`)
        })
      }
    }

    // 3. Strategy: Instead of deleting, consolidate data
    const keepBraider = duplicates[0] // Keep the oldest approved one
    const mergeBraiders = duplicates.slice(1) // Merge others into this one
    
    console.log(`\n📋 Strategy: Keep ${keepBraider.id}, merge others into it`)
    
    for (const braiderToMerge of mergeBraiders) {
      console.log(`\n🔄 Merging ${braiderToMerge.id} into ${keepBraider.id}...`)
      
      // Move bookings to the kept braider
      const { error: moveBookingsError } = await supabase
        .from('bookings')
        .update({ braider_id: keepBraider.id })
        .eq('braider_id', braiderToMerge.id)
      
      if (moveBookingsError) {
        console.error(`  ❌ Error moving bookings: ${moveBookingsError.message}`)
      } else {
        console.log(`  ✅ Moved bookings to kept braider`)
      }
      
      // Move services to the kept braider
      const { error: moveServicesError } = await supabase
        .from('services')
        .update({ braider_id: keepBraider.id })
        .eq('braider_id', braiderToMerge.id)
      
      if (moveServicesError) {
        console.error(`  ❌ Error moving services: ${moveServicesError.message}`)
      } else {
        console.log(`  ✅ Moved services to kept braider`)
      }
      
      // Now try to delete the merged braider
      const { error: deleteError } = await supabase
        .from('braiders')
        .delete()
        .eq('id', braiderToMerge.id)
      
      if (deleteError) {
        console.error(`  ❌ Error deleting braider: ${deleteError.message}`)
      } else {
        console.log(`  ✅ Deleted duplicate braider: ${braiderToMerge.id}`)
      }
    }

    // 4. Final verification
    console.log('\n✅ Final verification...')
    const { data: finalCheck, error: finalError } = await supabase
      .from('braiders')
      .select('id, status, contact_email')
      .eq('contact_email', email)
    
    if (finalError) {
      console.error('❌ Error in final check:', finalError)
    } else {
      console.log(`📊 Remaining braiders for ${email}: ${finalCheck.length}`)
      finalCheck.forEach(b => {
        console.log(`  - ${b.status} (ID: ${b.id})`)
      })
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

fixDuplicateWithForeignKey()
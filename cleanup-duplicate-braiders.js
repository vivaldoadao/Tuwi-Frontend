const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupDuplicateBraiders() {
  console.log('🧹 Starting cleanup of duplicate braiders...')
  
  try {
    // 1. Get all braiders grouped by email
    console.log('\n1. Finding duplicate emails...')
    const { data: allBraiders, error: fetchError } = await supabase
      .from('braiders')
      .select('id, contact_email, status, created_at')
      .order('created_at', { ascending: true }) // Oldest first
    
    if (fetchError) {
      console.error('❌ Error fetching braiders:', fetchError)
      return
    }

    // Group by email (case insensitive)
    const emailGroups = {}
    allBraiders.forEach(braider => {
      if (braider.contact_email) {
        const normalizedEmail = braider.contact_email.trim().toLowerCase()
        if (!emailGroups[normalizedEmail]) {
          emailGroups[normalizedEmail] = []
        }
        emailGroups[normalizedEmail].push(braider)
      }
    })

    // Find duplicates
    const duplicateEmails = Object.entries(emailGroups).filter(([email, braiders]) => braiders.length > 1)
    
    console.log(`📊 Found ${duplicateEmails.length} emails with duplicates:`)
    duplicateEmails.forEach(([email, braiders]) => {
      console.log(`  📧 ${email}: ${braiders.length} records`)
      braiders.forEach((b, i) => {
        console.log(`    ${i + 1}. ${b.status} (${b.created_at}) - ID: ${b.id}`)
      })
    })

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }

    // 2. For each duplicate email, keep only the best record
    console.log('\n2. Cleaning up duplicates...')
    
    for (const [email, braiders] of duplicateEmails) {
      console.log(`\n🔧 Processing ${email}...`)
      
      // Determine which record to keep:
      // Priority: approved > pending > rejected
      // If same status, keep the oldest (first registered)
      const approved = braiders.filter(b => b.status === 'approved')
      const pending = braiders.filter(b => b.status === 'pending')
      const rejected = braiders.filter(b => b.status === 'rejected')
      
      let recordToKeep
      let recordsToDelete = []
      
      if (approved.length > 0) {
        // Keep the oldest approved record
        recordToKeep = approved[0]
        recordsToDelete = [...approved.slice(1), ...pending, ...rejected]
        console.log(`  ✅ Keeping oldest approved record: ${recordToKeep.id}`)
      } else if (pending.length > 0) {
        // Keep the oldest pending record
        recordToKeep = pending[0]
        recordsToDelete = [...pending.slice(1), ...rejected]
        console.log(`  ⏳ Keeping oldest pending record: ${recordToKeep.id}`)
      } else {
        // Keep the newest rejected record (in case they want to try again)
        recordToKeep = rejected[rejected.length - 1]
        recordsToDelete = rejected.slice(0, -1)
        console.log(`  ❌ Keeping newest rejected record: ${recordToKeep.id}`)
      }

      // Update the kept record to have normalized email
      if (recordToKeep.contact_email !== email) {
        console.log(`  📝 Normalizing email for kept record...`)
        const { error: updateError } = await supabase
          .from('braiders')
          .update({ contact_email: email })
          .eq('id', recordToKeep.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating email: ${updateError.message}`)
        } else {
          console.log(`  ✅ Email normalized`)
        }
      }

      // Delete duplicate records
      console.log(`  🗑️ Deleting ${recordsToDelete.length} duplicate records...`)
      for (const record of recordsToDelete) {
        const { error: deleteError } = await supabase
          .from('braiders')
          .delete()
          .eq('id', record.id)
        
        if (deleteError) {
          console.error(`  ❌ Error deleting ${record.id}: ${deleteError.message}`)
        } else {
          console.log(`  ✅ Deleted ${record.status} record: ${record.id}`)
        }
      }
    }

    // 3. Normalize all remaining emails
    console.log('\n3. Normalizing all remaining emails...')
    const { data: remainingBraiders, error: remainingError } = await supabase
      .from('braiders')
      .select('id, contact_email')
    
    if (remainingError) {
      console.error('❌ Error fetching remaining braiders:', remainingError)
      return
    }

    for (const braider of remainingBraiders) {
      if (braider.contact_email) {
        const normalized = braider.contact_email.trim().toLowerCase()
        if (braider.contact_email !== normalized) {
          const { error: normalizeError } = await supabase
            .from('braiders')
            .update({ contact_email: normalized })
            .eq('id', braider.id)
          
          if (normalizeError) {
            console.error(`❌ Error normalizing ${braider.id}: ${normalizeError.message}`)
          } else {
            console.log(`📝 Normalized: ${braider.contact_email} → ${normalized}`)
          }
        }
      }
    }

    console.log('\n🎉 Cleanup completed!')
    
    // 4. Final verification
    console.log('\n4. Final verification...')
    const { data: finalBraiders, error: finalError } = await supabase
      .from('braiders')
      .select('contact_email')
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
      return
    }

    const finalEmailGroups = {}
    finalBraiders.forEach(braider => {
      if (braider.contact_email) {
        const email = braider.contact_email
        finalEmailGroups[email] = (finalEmailGroups[email] || 0) + 1
      }
    })

    const finalDuplicates = Object.entries(finalEmailGroups).filter(([email, count]) => count > 1)
    
    if (finalDuplicates.length === 0) {
      console.log('✅ No duplicates remaining!')
    } else {
      console.log('⚠️ Still have duplicates:')
      finalDuplicates.forEach(([email, count]) => {
        console.log(`  📧 ${email}: ${count} records`)
      })
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

cleanupDuplicateBraiders()
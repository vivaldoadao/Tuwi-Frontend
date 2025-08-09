import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getServiceClient()

    // Get all user presence data
    const { data: presence, error } = await supabase
      .from('user_presence')
      .select('*')
      .order('last_activity', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    // Get user info for the presence records
    const userIds = presence?.map(p => p.user_id) || []
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)

    const usersMap = new Map(users?.map(u => [u.id, u]) || [])

    const enrichedPresence = presence?.map(p => ({
      ...p,
      user_info: usersMap.get(p.user_id)
    })) || []

    return NextResponse.json({
      success: true,
      presence_records: enrichedPresence,
      online_count: presence?.filter(p => p.is_online).length || 0,
      total_users: presence?.length || 0,
      instructions: [
        '1. Check if users show is_online: true',
        '2. Look for recent last_activity timestamps',
        '3. Verify presence system is working'
      ]
    })

  } catch (error) {
    console.error('Test presence error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST() {
  try {
    const supabase = getServiceClient()

    // Set test user online
    const testUserId = 'ac6285cb-de10-49fa-aa47-b2d6d1e427ea' // Vivaldo
    
    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: testUserId,
      p_is_online: true,
      p_user_agent: 'Test Agent',
      p_ip_address: null
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to set user online: ${error.message}`
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Test user set online successfully',
      user_id: testUserId
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
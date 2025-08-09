import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  try {
    const supabase = getServiceClient()

    // Run cleanup function to mark inactive users as offline
    const { error } = await supabase.rpc('cleanup_offline_users')

    if (error) {
      console.error('Error running cleanup:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get count of users that were cleaned up
    const { data: stats } = await supabase
      .from('user_presence')
      .select('is_online')
    
    const onlineCount = stats?.filter(u => u.is_online).length || 0
    const totalCount = stats?.length || 0

    return NextResponse.json({ 
      success: true,
      message: 'Cleanup completed successfully',
      stats: {
        online_users: onlineCount,
        total_users: totalCount,
        offline_users: totalCount - onlineCount
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
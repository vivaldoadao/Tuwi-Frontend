import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { success: false, error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Get presence data using service role to bypass RLS
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', userIds)

    if (error) {
      console.error('Error getting user presence:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      presence: data || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
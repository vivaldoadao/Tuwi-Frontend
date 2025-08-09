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
    const { userId, isOnline, userAgent } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Update user presence using RPC function with service role
    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: userId,
      p_is_online: isOnline,
      p_user_agent: userAgent || 'Unknown',
      p_ip_address: null
    })

    if (error) {
      console.error('Error updating user presence:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${userId} set to ${isOnline ? 'online' : 'offline'}`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
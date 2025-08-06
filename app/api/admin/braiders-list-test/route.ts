import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/admin/braiders-list-test - Test endpoint to check braiders data
export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = getServiceClient()

    // First, check what we have in braiders table
    const { data: braiders, error: braidersError, count } = await serviceSupabase
      .from('braiders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)

    if (braidersError) {
      console.error('Error fetching braiders:', braidersError)
      return NextResponse.json({ error: 'Error fetching braiders', details: braidersError })
    }

    // Check users table for braider users
    const { data: users, error: usersError } = await serviceSupabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'braider')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Error fetching users', details: usersError })
    }

    return NextResponse.json({
      braiders: braiders || [],
      braidersCount: count || 0,
      users: users || [],
      usersCount: users?.length || 0,
      message: braiders?.length ? 'Found braiders in database' : 'No braiders found in database'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
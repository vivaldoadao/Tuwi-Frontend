import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging chat system...')
    
    const supabase = getServiceClient()

    // Check existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at')
      .limit(10)

    // Check existing braiders
    const { data: braiders, error: braidersError } = await supabase
      .from('braiders')
      .select(`
        id, 
        user_id, 
        name, 
        status, 
        location,
        users!braiders_user_id_fkey(name, email)
      `)
      .order('created_at')
      .limit(10)

    // Check the specific braider ID
    const { data: specificBraider, error: specificError } = await supabase
      .from('braiders')
      .select(`
        id, 
        user_id, 
        name, 
        status,
        users!braiders_user_id_fkey(name, email)
      `)
      .eq('id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
      .single()

    // Check existing conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        participant_1_id,
        participant_2_id,
        last_message_content,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Check existing messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      debug_info: {
        users: {
          data: users,
          count: users?.length || 0,
          error: usersError?.message
        },
        braiders: {
          data: braiders,
          count: braiders?.length || 0,
          error: braidersError?.message
        },
        specific_braider: {
          data: specificBraider,
          found: !!specificBraider,
          error: specificError?.message
        },
        conversations: {
          data: conversations,
          count: conversations?.length || 0,
          error: conversationsError?.message
        },
        messages: {
          data: messages,
          count: messages?.length || 0,
          error: messagesError?.message
        }
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
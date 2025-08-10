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

    console.log('🔍 Debugging real-time setup...')

    // Test 1: Check if tables are in realtime publication
    const { data: realtimeTables, error: rtTablesError } = await supabase
      .from('pg_publication_tables')
      .select('tablename')
      .eq('pubname', 'supabase_realtime')

    console.log('📡 Tables in realtime publication:', realtimeTables)

    // Test 2: Check RLS policies on messages table
    const { data: messagePolicies, error: policiesError } = await supabase
      .rpc('pg_policies', { table_name: 'messages' })
      .then(() => ({ data: 'RLS function not available', error: null }))
      .catch(() => ({ data: 'Could not check policies', error: null }))

    // Test 3: Get recent messages to see structure
    const { data: recentMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, conversation_id')
      .order('created_at', { ascending: false })
      .limit(5)

    // Test 4: Get active conversations
    const { data: activeConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id, last_message_content')
      .order('updated_at', { ascending: false })
      .limit(3)

    // Test 5: Check typing_indicators table
    const { data: typingIndicators, error: typingError } = await supabase
      .from('typing_indicators')
      .select('*')
      .limit(3)

    console.log('⌨️ Typing indicators:', typingIndicators)

    return NextResponse.json({
      success: true,
      debug_info: {
        realtime_tables: {
          data: realtimeTables,
          error: rtTablesError?.message,
          has_messages: realtimeTables?.some(t => t.tablename === 'messages'),
          has_typing_indicators: realtimeTables?.some(t => t.tablename === 'typing_indicators')
        },
        rls_policies: {
          data: messagePolicies,
          error: policiesError?.message
        },
        recent_messages: {
          data: recentMessages,
          count: recentMessages?.length || 0,
          error: messagesError?.message
        },
        active_conversations: {
          data: activeConversations,
          count: activeConversations?.length || 0,
          error: convError?.message
        },
        typing_indicators: {
          data: typingIndicators,
          count: typingIndicators?.length || 0,
          error: typingError?.message
        },
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        realtime_status: {
          messages_enabled: realtimeTables?.some(t => t.tablename === 'messages') ? '✅' : '❌',
          typing_enabled: realtimeTables?.some(t => t.tablename === 'typing_indicators') ? '✅' : '❌',
          conversations_enabled: realtimeTables?.some(t => t.tablename === 'conversations') ? '✅' : '❌',
        },
        realtime_recommendations: [
          realtimeTables?.some(t => t.tablename === 'messages') ? '✅ Messages table in realtime' : '❌ ADD messages table to realtime',
          realtimeTables?.some(t => t.tablename === 'typing_indicators') ? '✅ Typing indicators in realtime' : '❌ ADD typing_indicators to realtime',
          '3. Check browser console for real-time subscription logs',
          '4. Verify RLS policies are not blocking real-time'
        ]
      }
    })

  } catch (error) {
    console.error('💥 Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        'Check Supabase connection',
        'Verify environment variables',
        'Check service role key permissions'
      ]
    })
  }
}

export async function POST() {
  try {
    const supabase = getServiceClient()

    console.log('🔧 Attempting to fix real-time configuration...')

    // Enable real-time for messages table (this might fail if already enabled)
    const fixes = []

    try {
      // Try to enable real-time publication for messages
      const { error: rtError } = await supabase.rpc('enable_realtime_for_messages')
      if (rtError) {
        fixes.push(`Real-time enable failed: ${rtError.message}`)
      } else {
        fixes.push('✅ Real-time enabled for messages table')
      }
    } catch (e) {
      fixes.push('⚠️ Could not enable real-time (might already be enabled)')
    }

    // Create a test message to trigger real-time
    const testConversationId = 'f1e71335-ddd1-4ce2-b201-49fc5990f696' // From your logs
    const testUserId = '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b' // znattechnology95@gmail.com

    const { data: testMessage, error: testError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConversationId,
        sender_id: testUserId,
        content: `🧪 Real-time test message - ${new Date().toISOString()}`,
        message_type: 'text',
        is_delivered: true
      })
      .select()
      .single()

    if (testError) {
      fixes.push(`❌ Test message failed: ${testError.message}`)
    } else {
      fixes.push(`✅ Test message sent: ${testMessage?.id}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Real-time fixes attempted',
      fixes: fixes,
      next_steps: [
        '1. Open chat in two browser windows/tabs',
        '2. Send messages from each window',
        '3. Check browser console for real-time logs',
        '4. Look for "📨 New message received" logs'
      ]
    })

  } catch (error) {
    console.error('💥 Fix error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
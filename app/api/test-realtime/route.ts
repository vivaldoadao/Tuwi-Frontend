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

    console.log('🧪 Testing real-time messaging...')

    // Test conversation ID from debug logs
    const testConversationId = 'f1e71335-ddd1-4ce2-b201-49fc5990f696'
    const testUserId1 = '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b' // znattechnology95@gmail.com
    const testUserId2 = '88888888-8888-8888-8888-888888888888' // Camila (test user)

    const testMessages = [
      {
        conversation_id: testConversationId,
        sender_id: testUserId1,
        content: `🧪 Real-time test from User 1 - ${new Date().toISOString()}`,
        message_type: 'text',
        is_delivered: true
      },
      {
        conversation_id: testConversationId,
        sender_id: testUserId2,
        content: `🧪 Real-time test from User 2 - ${new Date().toISOString()}`,
        message_type: 'text', 
        is_delivered: true
      }
    ]

    const results = []

    for (const testMessage of testMessages) {
      console.log('📤 Sending test message from:', testMessage.sender_id)
      
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single()

      if (messageError) {
        console.error('❌ Error sending test message:', messageError)
        results.push({
          success: false,
          error: messageError.message,
          sender: testMessage.sender_id
        })
      } else {
        console.log('✅ Test message sent:', message.id)
        results.push({
          success: true,
          messageId: message.id,
          sender: testMessage.sender_id,
          content: message.content
        })
      }

      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Get latest messages from conversation
    const { data: latestMessages } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', testConversationId)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      message: 'Real-time test completed',
      results,
      latest_messages: latestMessages,
      instructions: [
        '1. Open chat interface for both users in separate browser tabs',
        '2. Check if test messages appear in real-time',
        '3. Look for console logs: "📨 New message received" and "🔔 New message notification"',
        '4. Verify sender information loads correctly'
      ]
    })

  } catch (error) {
    console.error('💥 Real-time test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting real-time message test...')
    
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conversationId, testMessage } = body
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId é obrigatório' },
        { status: 400 }
      )
    }

    const serviceSupabase = getServiceClient()

    // Get current user ID
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('👤 Sending test message as user:', userData.id)
    console.log('💬 To conversation:', conversationId)

    // Insert test message directly to database
    const { data: message, error: messageError } = await serviceSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.id,
        content: testMessage || `🧪 REAL-TIME TEST MESSAGE - ${new Date().toISOString()}`,
        message_type: 'text',
        is_delivered: true
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        created_at
      `)
      .single()

    if (messageError) {
      console.error('❌ Error inserting test message:', messageError)
      return NextResponse.json(
        { success: false, error: 'Erro ao inserir mensagem de teste', details: messageError.message },
        { status: 500 }
      )
    }

    console.log('✅ Test message inserted:', message.id)

    // Verify the message was actually inserted
    const { data: verification, error: verifyError } = await serviceSupabase
      .from('messages')
      .select('*')
      .eq('id', message.id)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying message:', verifyError)
    } else {
      console.log('✅ Message verified in database:', verification)
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem de teste enviada - deve aparecer em tempo real!',
      data: {
        messageId: message.id,
        conversationId: message.conversation_id,
        content: message.content,
        senderId: message.sender_id,
        timestamp: message.created_at,
        verification: !!verification
      },
      instructions: [
        '1. Abra o chat na conversation: ' + conversationId,
        '2. A mensagem deve aparecer INSTANTANEAMENTE',
        '3. Verifique os logs no console do browser',
        '4. Procure por "📨 New message received via real-time"'
      ]
    })

  } catch (error) {
    console.error('💥 Test error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro no teste' },
      { status: 500 }
    )
  }
}
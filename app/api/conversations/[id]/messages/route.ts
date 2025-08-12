import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Server-side service client with admin privileges to bypass RLS
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Starting conversation messages API...')
    
    const { id } = await params
    const conversationId = id
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('👤 Authenticated user:', { 
      email: session.user.email,
      conversationId,
      limit,
      offset
    })

    // Use service client to bypass RLS
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

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === userData.id || 
                         conversation.participant_2_id === userData.id

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para acessar esta conversa' },
        { status: 403 }
      )
    }

    // Get messages (without join first)
    const { data: messages, error: messagesError } = await serviceSupabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        attachments,
        metadata,
        is_delivered,
        is_read,
        read_at,
        reply_to_message_id,
        is_edited,
        edited_at,
        is_deleted,
        deleted_at,
        created_at,
        updated_at
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar mensagens' },
        { status: 500 }
      )
    }

    console.log('📊 Found messages:', messages?.length || 0)

    // Get unique sender IDs
    const senderIds = [...new Set(messages?.map(msg => msg.sender_id) || [])]
    
    // Get sender information
    const { data: senders } = await serviceSupabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', senderIds)
    
    // Create sender lookup
    const sendersMap = new Map(senders?.map(sender => [sender.id, sender]) || [])

    // Format messages with sender info
    const formattedMessages = (messages || []).map(msg => {
      const sender = sendersMap.get(msg.sender_id)
      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        messageType: msg.message_type,
        attachments: msg.attachments || [],
        metadata: msg.metadata,
        isDelivered: msg.is_delivered,
        isRead: msg.is_read,
        readAt: msg.read_at,
        replyToMessageId: msg.reply_to_message_id,
        isEdited: msg.is_edited,
        editedAt: msg.edited_at,
        timestamp: msg.created_at,
        updatedAt: msg.updated_at,
        sender: {
          id: sender?.id || msg.sender_id,
          name: sender?.name || 'Usuário',
          email: sender?.email || '',
          avatar: sender?.avatar_url || `/placeholder.svg?height=40&width=40&text=${sender?.name?.[0] || 'U'}`
        }
      }
    })

    // Mark messages as read for the current user
    if (formattedMessages.length > 0) {
      const { error: markReadError } = await serviceSupabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userData.id
        })

      if (markReadError) {
        console.error('⚠️ Error marking messages as read:', markReadError)
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
      hasMore: formattedMessages.length === limit,
      conversationId
    })

  } catch (error) {
    console.error('💥 Unexpected error in conversation messages API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Starting send message API...')
    
    const { id } = await params
    const conversationId = id
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      content, 
      messageType = 'text', 
      attachments = [],
      metadata = null,
      replyToMessageId = null 
    } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo da mensagem é obrigatório' },
        { status: 400 }
      )
    }

    console.log('👤 Sending message:', { 
      email: session.user.email,
      conversationId,
      messageType
    })

    // Use service client to bypass RLS
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

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === userData.id || 
                         conversation.participant_2_id === userData.id

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para enviar mensagem nesta conversa' },
        { status: 403 }
      )
    }

    // Insert the message
    const { data: message, error: messageError } = await serviceSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.id,
        content: content.trim(),
        message_type: messageType,
        attachments: attachments.length > 0 ? attachments : null,
        metadata,
        reply_to_message_id: replyToMessageId,
        is_delivered: true // Mark as delivered immediately for simplicity
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        attachments,
        metadata,
        is_delivered,
        is_read,
        read_at,
        reply_to_message_id,
        created_at,
        updated_at
      `)
      .single()

    if (messageError) {
      console.error('❌ Error sending message:', messageError)
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar mensagem' },
        { status: 500 }
      )
    }

    console.log('✅ Message sent:', message.id)

    // Get sender info for response
    const { data: senderInfo } = await serviceSupabase
      .from('users')
      .select('id, name, email')
      .eq('id', message.sender_id)
      .single()

    // Format response
    const formattedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      messageType: message.message_type,
      attachments: message.attachments || [],
      metadata: message.metadata,
      isDelivered: message.is_delivered,
      isRead: message.is_read,
      readAt: message.read_at,
      replyToMessageId: message.reply_to_message_id,
      timestamp: message.created_at,
      updatedAt: message.updated_at,
      sender: {
        id: senderInfo?.id || message.sender_id,
        name: senderInfo?.name || 'Usuário',
        email: senderInfo?.email || '',
        avatar: `/placeholder.svg?height=40&width=40&text=${senderInfo?.name?.[0] || 'U'}`
      }
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage
    })

  } catch (error) {
    console.error('💥 Unexpected error in send message API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
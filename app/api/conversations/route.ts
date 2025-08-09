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

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting conversations API...')
    
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
      email: session.user.email 
    })

    // Use service client to bypass RLS for complex queries
    const serviceSupabase = getServiceClient()

    // Get user ID from email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('❌ Error fetching user:', userError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('📝 User data:', userData)

    // Get user's conversations using service client (bypasses RLS)
    // Query conversations where user is participant 1 or participant 2
    const { data: conversations, error: conversationsError } = await serviceSupabase
      .from('conversations')
      .select(`
        id,
        participant_1_id,
        participant_2_id,
        status,
        last_message_content,
        last_message_timestamp,
        last_message_sender_id,
        participant_1_last_read_at,
        participant_2_last_read_at,
        created_at,
        updated_at
      `)
      .or(`participant_1_id.eq.${userData.id},participant_2_id.eq.${userData.id}`)

    console.log('🔍 Query result:', { conversations, conversationsError })

    if (conversationsError) {
      console.error('❌ Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { success: false, error: conversationsError.message || 'Erro ao buscar conversas' },
        { status: 500 }
      )
    }

    console.log('📊 Found conversations:', conversations?.length || 0)

    // Format conversations - simplified approach
    const formattedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Determine who is the other participant
        const isParticipant1 = conv.participant_1_id === userData.id
        const otherParticipantId = isParticipant1 ? conv.participant_2_id : conv.participant_1_id

        // Get other participant info
        const { data: otherUser } = await serviceSupabase
          .from('users')
          .select('id, name, email, avatar_url')
          .eq('id', otherParticipantId)
          .single()

        // Get unread message count - simple query
        const { count: unreadCount } = await serviceSupabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userData.id)
          .eq('is_read', false)

        return {
          id: conv.id,
          status: conv.status || 'active',
          participant: {
            id: otherUser?.id || otherParticipantId,
            name: otherUser?.name || 'Usuário',
            email: otherUser?.email || '',
            avatar: otherUser?.avatar_url || `/placeholder.svg?height=50&width=50&text=${otherUser?.name?.[0] || 'U'}`,
            isOnline: false, // TODO: Implement real online status
            lastSeen: 'Há alguns minutos' // TODO: Implement real last seen
          },
          lastMessage: {
            content: conv.last_message_content || 'Nenhuma mensagem ainda',
            timestamp: conv.last_message_timestamp 
              ? new Date(conv.last_message_timestamp).toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : '',
            isRead: true,
            sender: conv.last_message_sender_id === userData.id ? 'current' : 'other'
          },
          unreadCount: unreadCount || 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      count: formattedConversations.length,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in conversations API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting create conversation API...')
    
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
    const { participantId, initialMessage } = body

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'ID do participante é obrigatório' },
        { status: 400 }
      )
    }

    console.log('👤 Creating conversation between:', { 
      currentUser: session.user.email,
      participantId 
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

    // Try to find braider first, but fallback to direct user lookup
    let targetUserId = participantId
    
    // First, check if participantId is a braider ID
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, user_id')
      .eq('id', participantId)
      .single()

    if (braiderData && braiderData.user_id) {
      // Found braider, use their user_id
      targetUserId = braiderData.user_id
      console.log('✅ Found braider, using user_id:', targetUserId)
    } else {
      // Braider not found, assume participantId is already a user_id
      console.log('⚠️ Braider not found, assuming participantId is user_id:', participantId)
    }

    // Verify the target user exists and has braider role
    const { data: otherUser, error: otherUserError } = await serviceSupabase
      .from('users')
      .select('id, name, role')
      .eq('id', targetUserId)
      .single()

    if (otherUserError || !otherUser) {
      console.error('❌ Target user not found:', otherUserError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (otherUser.role !== 'braider') {
      console.error('❌ User is not a braider:', otherUser.role)
      return NextResponse.json(
        { success: false, error: 'Usuário não é uma trancista' },
        { status: 400 }
      )
    }

    // Call the stored function to get or create conversation
    const { data: conversationResult, error: conversationError } = await serviceSupabase
      .rpc('get_or_create_conversation', {
        p_user1_id: userData.id,
        p_user2_id: targetUserId
      })

    if (conversationError) {
      console.error('❌ Error creating conversation:', conversationError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar conversa' },
        { status: 500 }
      )
    }

    const conversationId = conversationResult

    console.log('✅ Conversation created/found:', conversationId)

    // If there's an initial message, send it
    if (initialMessage && initialMessage.trim()) {
      const { error: messageError } = await serviceSupabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userData.id,
          content: initialMessage.trim(),
          message_type: 'text'
        })

      if (messageError) {
        console.error('❌ Error sending initial message:', messageError)
        // Don't fail the whole request if message fails
      }
    }

    return NextResponse.json({
      success: true,
      conversationId,
      message: 'Conversa criada com sucesso'
    })

  } catch (error) {
    console.error('💥 Unexpected error in create conversation API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
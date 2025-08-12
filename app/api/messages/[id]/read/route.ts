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

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Starting mark message as read API...')
    
    const { id } = await params
    const messageId = id
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('👤 Marking message as read:', { 
      email: session.user.email,
      messageId
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

    // Get message details and verify access
    const { data: message, error: messageError } = await serviceSupabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        is_read,
        conversations(participant_1_id, participant_2_id)
      `)
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { success: false, error: 'Mensagem não encontrada' },
        { status: 404 }
      )
    }

    // Verify user has access to this conversation
    const conversation = Array.isArray(message.conversations) ? message.conversations[0] : message.conversations
    const isParticipant = conversation?.participant_1_id === userData.id || 
                         conversation?.participant_2_id === userData.id

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para marcar esta mensagem como lida' },
        { status: 403 }
      )
    }

    // Cannot mark own messages as read
    if (message.sender_id === userData.id) {
      return NextResponse.json(
        { success: false, error: 'Não é possível marcar suas próprias mensagens como lidas' },
        { status: 400 }
      )
    }

    // Update message if not already read
    if (!message.is_read) {
      const { error: updateError } = await serviceSupabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (updateError) {
        console.error('❌ Error marking message as read:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao marcar mensagem como lida' },
          { status: 500 }
        )
      }

      // Update conversation last read timestamp
      const { error: convUpdateError } = await serviceSupabase
        .from('conversations')
        .update({
          participant_1_last_read_at: conversation.participant_1_id === userData.id 
            ? new Date().toISOString() 
            : undefined,
          participant_2_last_read_at: conversation.participant_2_id === userData.id 
            ? new Date().toISOString() 
            : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.conversation_id)

      if (convUpdateError) {
        console.error('⚠️ Error updating conversation read timestamp:', convUpdateError)
        // Don't fail the request if this fails
      }

      console.log('✅ Message marked as read:', messageId)
    } else {
      console.log('📝 Message already marked as read:', messageId)
    }

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Mensagem marcada como lida'
    })

  } catch (error) {
    console.error('💥 Unexpected error in mark message as read API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
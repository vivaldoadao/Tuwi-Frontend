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

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ Starting delete conversation API...')
    
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

    console.log('👤 Authenticated user:', { 
      email: session.user.email,
      conversationId
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
        { success: false, error: 'Sem permissão para deletar esta conversa' },
        { status: 403 }
      )
    }

    console.log('✅ Permission verified, proceeding with deletion')

    // Delete all messages in this conversation first
    const { error: messagesDeleteError } = await serviceSupabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (messagesDeleteError) {
      console.error('❌ Error deleting messages:', messagesDeleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar mensagens da conversa' },
        { status: 500 }
      )
    }

    console.log('✅ Messages deleted successfully')

    // Now delete the conversation
    const { error: conversationDeleteError } = await serviceSupabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (conversationDeleteError) {
      console.error('❌ Error deleting conversation:', conversationDeleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar conversa' },
        { status: 500 }
      )
    }

    console.log('✅ Conversation deleted successfully')

    return NextResponse.json({
      success: true,
      message: "Conversa deletada com sucesso"
    })

  } catch (error) {
    console.error('💥 Unexpected error in delete conversation API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
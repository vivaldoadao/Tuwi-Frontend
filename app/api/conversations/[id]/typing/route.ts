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

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Starting typing indicator API...')
    
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
    const { isTyping } = body

    console.log('👤 Typing indicator:', { 
      email: session.user.email,
      conversationId,
      isTyping
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

    // Update or insert typing status
    if (isTyping) {
      const { error: upsertError } = await serviceSupabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: userData.id,
          is_typing: true,
          last_typed_at: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        })

      if (upsertError) {
        console.error('❌ Error updating typing status:', upsertError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar status de digitação' },
          { status: 500 }
        )
      }
    } else {
      // Remove typing indicator when user stops typing
      const { error: deleteError } = await serviceSupabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userData.id)

      if (deleteError) {
        console.error('❌ Error removing typing status:', deleteError)
        // Don't fail the request for this
      }
    }

    console.log('✅ Typing indicator updated successfully')

    return NextResponse.json({
      success: true,
      isTyping,
      conversationId
    })

  } catch (error) {
    console.error('💥 Unexpected error in typing indicator API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
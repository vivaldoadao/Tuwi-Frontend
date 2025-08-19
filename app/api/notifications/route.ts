import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import type { NotificationType } from '@/context/notifications-context'

// GET /api/notifications - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    const supabase = await createClient()

    // SEGURANÇA NA API: Buscar primeiro o user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({
        notifications: [],
        total: 0,
        hasMore: false,
        unreadCount: 0,
        note: 'User validation failed'
      })
    }

    // SEGURANÇA NA API: Garantir que só acessa dados do próprio usuário
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userData.id) // CRÍTICO: Filtro de segurança por email validado
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      // Retornar estado seguro em caso de erro
      return NextResponse.json({
        notifications: [],
        total: 0,
        hasMore: false,
        unreadCount: 0,
        note: 'API security layer - safe fallback'
      })
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      hasMore: (page * limit) < (count || 0),
      unreadCount: unreadOnly ? count || 0 : undefined
    })

  } catch (error) {
    console.error('Unexpected error fetching notifications:', error)
    // Estado seguro em caso de erro inesperado
    return NextResponse.json({
      notifications: [],
      total: 0,
      hasMore: false,
      unreadCount: 0,
      note: 'API security layer - error fallback'
    })
  }
}

// POST /api/notifications - Criar nova notificação (será enviada via socket)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      message,
      isImportant = false,
      actionUrl,
      actionLabel,
      metadata = {},
      targetUserId // Para notificações direcionadas a outros usuários (admin feature)
    } = body

    // Validação
    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, title, message' 
      }, { status: 400 })
    }

    const validTypes: NotificationType[] = ['info', 'success', 'warning', 'error', 'order', 'message', 'booking', 'system']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid notification type' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // SEGURANÇA NA API: Buscar user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User validation failed' }, { status: 400 })
    }

    // SEGURANÇA NA API: Verificar permissões para targetUserId
    let userId = userData.id
    if (targetUserId) {
      // Só admins podem enviar notificações para outros usuários
      if (userData.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Only admins can send notifications to other users' 
        }, { status: 403 })
      }
      userId = targetUserId
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId, // SEGURANÇA: userId validado por email
        type,
        title,
        message,
        is_important: isImportant,
        action_url: actionUrl,
        action_label: actionLabel,
        metadata
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // 🚀 ENVIAR VIA WEBSOCKET EM TEMPO REAL
    try {
      // Tentar enviar via WebSocket através do endpoint notify
      const socketResponse = await fetch(`${request.nextUrl.origin}/api/socket/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          userId: userId,
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.created_at,
            isRead: notification.is_read,
            isImportant: notification.is_important,
            actionUrl: notification.action_url,
            actionLabel: notification.action_label,
            metadata: notification.metadata
          }
        })
      })

      if (socketResponse.ok) {
        console.log('✅ Notification sent via WebSocket')
      } else {
        console.warn('⚠️ WebSocket notification failed, but API creation succeeded')
      }
    } catch (socketError) {
      console.warn('⚠️ WebSocket notification error (non-critical):', socketError)
      // Não falhar a requisição se o socket falhar - notificação foi criada no banco
    }

    return NextResponse.json({ notification }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error creating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications - Limpar todas as notificações
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // SEGURANÇA NA API: Buscar user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User validation failed' }, { status: 400 })
    }

    // SEGURANÇA NA API: Só deletar notificações do próprio usuário
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userData.id) // CRÍTICO: Filtro de segurança por email validado

    if (error) {
      console.error('Error clearing notifications:', error)
      return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
    }

    return NextResponse.json({ message: 'All notifications cleared' })

  } catch (error) {
    console.error('Unexpected error clearing notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
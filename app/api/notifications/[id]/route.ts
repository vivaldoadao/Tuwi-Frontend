import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

// PATCH /api/notifications/[id] - Marcar notificação como lida/não lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isRead } = body

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ 
        error: 'isRead must be a boolean' 
      }, { status: 400 })
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

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: isRead })
      .eq('id', (await params).id)
      .eq('user_id', userData.id) // CRÍTICO: Filtro de segurança por email validado
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ notification })

  } catch (error) {
    console.error('Unexpected error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Deletar notificação específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
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

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', (await params).id)
      .eq('user_id', userData.id) // CRÍTICO: Filtro de segurança por email validado

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notification deleted' })

  } catch (error) {
    console.error('Unexpected error deleting notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
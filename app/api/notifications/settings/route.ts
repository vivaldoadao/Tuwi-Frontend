import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

// GET /api/notifications/settings - Buscar configurações de notificações
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ 
        settings: {
          enable_toasts: true,
          enable_sound: true,
          enable_desktop: false,
          auto_mark_as_read: false
        },
        note: 'User validation failed - using defaults'
      })
    }

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userData.id) // CRÍTICO: Filtro de segurança por email validado
      .single()

    if (error) {
      // Se não encontrar configurações, criar padrões
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert([{
            user_id: userData.id, // SEGURANÇA: Usar ID validado por email
            enable_toasts: true,
            enable_sound: true,
            enable_desktop: false,
            auto_mark_as_read: false
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating default notification settings:', createError)
          return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
        }

        return NextResponse.json({ settings: newSettings })
      }

      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Unexpected error fetching notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications/settings - Atualizar configurações de notificações
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      enableToasts,
      enableSound,
      enableDesktop,
      autoMarkAsRead
    } = body

    // Validação básica
    const booleanFields = { enableToasts, enableSound, enableDesktop, autoMarkAsRead }
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json({ 
          error: `${key} must be a boolean` 
        }, { status: 400 })
      }
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

    // Usar upsert para criar ou atualizar
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert([{
        user_id: userData.id, // SEGURANÇA: Usar ID validado por email
        enable_toasts: enableToasts,
        enable_sound: enableSound,
        enable_desktop: enableDesktop,
        auto_mark_as_read: autoMarkAsRead
      }])
      .select()
      .single()

    if (error) {
      console.error('Error updating notification settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Unexpected error updating notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
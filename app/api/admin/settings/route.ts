import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Admin check using existing auth system
async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// GET /api/admin/settings - Listar todas as configurações
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()

    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    let query = serviceClient
      .from('site_settings')
      .select('*')
      .order('category')
      .order('key')

    if (category) {
      query = query.eq('category', category)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings - Criar nova configuração
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    const body = await request.json()
    const { 
      key, 
      value, 
      description = '', 
      data_type = 'text',
      category = 'general',
      is_public = false
    } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const { data: newSetting, error } = await serviceClient
      .from('site_settings')
      .insert({
        key,
        value,
        description,
        data_type,
        category,
        is_public,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating setting:', error)
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 })
    }

    return NextResponse.json({ setting: newSetting }, { status: 201 })

  } catch (error) {
    console.error('Error in settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/settings - Atualizar configuração existente
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    const body = await request.json()
    const { 
      id,
      value, 
      description,
      is_public 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Setting ID is required' }, { status: 400 })
    }

    const updates: any = {
      updated_by: session.user.id
    }

    if (value !== undefined) updates.value = value
    if (description !== undefined) updates.description = description
    if (is_public !== undefined) updates.is_public = is_public

    const { data: updatedSetting, error } = await serviceClient
      .from('site_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ setting: updatedSetting })

  } catch (error) {
    console.error('Error in settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
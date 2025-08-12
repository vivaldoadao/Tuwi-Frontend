import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    return false
  }
}

// GET /api/promotions/packages - Listar pacotes disponíveis
export async function GET(request: NextRequest) {
  try {
    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // profile_highlight, hero_banner, combo
    const featured = url.searchParams.get('featured') // true/false

    let query = serviceClient
      .from('promotion_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('price')

    if (type) {
      query = query.eq('type', type)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: packages, error } = await query

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
    }

    // Buscar configurações públicas para contexto
    const { data: settings } = await serviceClient
      .from('promotion_settings')
      .select('key, value')
      .eq('is_public', true)

    const settingsMap = settings?.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {}) || {}

    return NextResponse.json({ 
      packages,
      settings: settingsMap
    })

  } catch (error) {
    console.error('Error in packages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/promotions/packages - Criar novo pacote (admin apenas)
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const body = await request.json()

    const {
      name,
      description,
      type,
      duration_days,
      price,
      original_price,
      features = [],
      is_featured = false,
      sort_order = 0,
      color = '#3B82F6',
      icon = 'star'
    } = body

    // Validações
    if (!name || !type || !duration_days || price === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: name, type, duration_days, price'
      }, { status: 400 })
    }

    const validTypes = ['profile_highlight', 'hero_banner', 'combo']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: 'Invalid package type'
      }, { status: 400 })
    }

    const { data: package_data, error } = await serviceClient
      .from('promotion_packages')
      .insert({
        name,
        description,
        type,
        duration_days,
        price,
        original_price,
        features,
        is_active: true,
        is_featured,
        sort_order,
        color,
        icon
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error)
      return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
    }

    return NextResponse.json({ package: package_data }, { status: 201 })

  } catch (error) {
    console.error('Error in packages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/promotions/packages - Atualizar pacote (admin apenas)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    const { data: updated, error } = await serviceClient
      .from('promotion_packages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating package:', error)
      return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
    }

    return NextResponse.json({ package: updated })

  } catch (error) {
    console.error('Error in packages PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/promotions/packages - Desativar pacote (admin apenas)
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    // Em vez de deletar, desativar o pacote
    const { data: updated, error } = await serviceClient
      .from('promotion_packages')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating package:', error)
      return NextResponse.json({ error: 'Failed to deactivate package' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Package deactivated successfully',
      package: updated 
    })

  } catch (error) {
    console.error('Error in packages DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
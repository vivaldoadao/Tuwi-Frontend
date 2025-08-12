import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS quando necessário
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verificar se usuário é admin
async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// GET /api/promotions - Listar promoções (suas próprias ou todas se admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // profile_highlight, hero_banner, combo_package
    const status = url.searchParams.get('status') // pending, active, expired, etc.
    const userId = url.searchParams.get('user_id') // Para admin ver promoções de usuário específico

    let query = serviceClient
      .from('promotions')
      .select(`
        *,
        promotion_packages(
          id,
          name,
          type,
          duration_days,
          price,
          features
        )
      `)
      .order('created_at', { ascending: false })

    // Filtros
    if (!await isAdmin()) {
      // Usuários normais só veem suas próprias promoções
      query = query.eq('user_id', session.user.id)
    } else if (userId) {
      // Admin pode filtrar por usuário específico
      query = query.eq('user_id', userId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: promotions, error } = await query

    if (error) {
      console.error('Error fetching promotions:', error)
      return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      promotions: promotions || []
    })

  } catch (error) {
    console.error('Error in promotions API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/promotions - Criar nova promoção
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const body = await request.json()
    
    const {
      type,
      title,
      description,
      start_date,
      end_date,
      content_data = {},
      package_id,
      price,
      duration_days,
      metadata = {}
    } = body

    // Validar campos obrigatórios
    if (!type || !title || !start_date || !end_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, title, start_date, end_date'
      }, { status: 400 })
    }

    // Validar tipo
    if (!['profile_highlight', 'hero_banner', 'combo_package'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid promotion type'
      }, { status: 400 })
    }

    // Validar datas
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (startDate >= endDate) {
      return NextResponse.json({
        success: false,
        error: 'Start date must be before end date'
      }, { status: 400 })
    }

    // Criar promoção
    const promotionData = {
      user_id: session.user.id,
      type,
      title,
      description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      content_data,
      package_id,
      price: price || 0,
      duration_days: duration_days || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      status: 'pending',
      views_count: 0,
      clicks_count: 0,
      contacts_count: 0,
      metadata
    }

    const { data: promotion, error } = await serviceClient
      .from('promotions')
      .insert(promotionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating promotion:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create promotion',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      promotion
    })

  } catch (error) {
    console.error('Error in POST promotions API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
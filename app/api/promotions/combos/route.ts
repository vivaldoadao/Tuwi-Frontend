import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { promotionComboService } from '@/lib/promotion-combos'

/**
 * API para gerenciar combos de promoções
 * 
 * GET /api/promotions/combos - Listar combos disponíveis
 * POST /api/promotions/combos - Criar novo combo (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const featuredOnly = searchParams.get('featured') === 'true'
    const includeInactive = searchParams.get('include_inactive') === 'true'

    // Para listar combos não precisa estar autenticado
    const combos = await promotionComboService.getAvailableCombos({
      featuredOnly,
      includeInactive
    })

    return NextResponse.json({
      success: true,
      combos,
      count: combos.length
    })

  } catch (error) {
    console.error('Error fetching combos:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch combos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * POST /api/promotions/combos - Criar novo combo (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      included_types,
      profile_highlight_days = 0,
      hero_banner_days = 0,
      combo_package_days = 0,
      regular_price,
      combo_price,
      badge_text = 'COMBO',
      highlight_color = '#10B981',
      features = [],
      is_active = true,
      is_featured = false,
      sort_order = 0,
      min_subscription_months = 1,
      max_uses_per_user = null
    } = body

    // Validações
    if (!name || !description || !included_types || included_types.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, included_types'
      }, { status: 400 })
    }

    if (!regular_price || !combo_price || combo_price > regular_price) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pricing: combo_price must be less than regular_price'
      }, { status: 400 })
    }

    // Verificar se tipos incluídos são válidos
    const validTypes = ['profile_highlight', 'hero_banner', 'combo_package']
    const invalidTypes = included_types.filter((type: string) => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid promotion types: ${invalidTypes.join(', ')}`
      }, { status: 400 })
    }

    // Criar combo via service (implementar depois)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: combo, error } = await supabase
      .from('promotion_combos')
      .insert({
        name,
        description,
        included_types,
        profile_highlight_days,
        hero_banner_days,
        combo_package_days,
        regular_price,
        combo_price,
        badge_text,
        highlight_color,
        features,
        is_active,
        is_featured,
        sort_order,
        min_subscription_months,
        max_uses_per_user
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating combo:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create combo',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Combo created successfully',
      combo
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/promotions/combos:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
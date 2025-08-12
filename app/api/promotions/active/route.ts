import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/promotions/active - Buscar promoções ativas publicamente (sem autenticação)
export async function GET(request: NextRequest) {
  try {
    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // profile_highlight, hero_banner, combo_package
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Verificar se sistema está habilitado
    const { data: systemEnabled } = await serviceClient
      .from('promotion_settings')
      .select('value')
      .eq('key', 'system_enabled')
      .single()

    if (!systemEnabled || systemEnabled.value !== true) {
      return NextResponse.json({ 
        promotions: [],
        message: 'Promotion system is disabled'
      })
    }

    // Buscar promoções ativas
    let query = serviceClient
      .from('promotions')
      .select(`
        id,
        type,
        title,
        content_data,
        start_date,
        end_date,
        views_count,
        clicks_count,
        user_id
      `)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    const { data: promotions, error } = await query

    if (error) {
      console.error('Error fetching active promotions:', error)
      return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }

    // Processar dados do usuário para mostrar apenas info necessária
    const processedPromotions = promotions?.map(promo => ({
      id: promo.id,
      type: promo.type,
      title: promo.title,
      content_data: promo.content_data,
      start_date: promo.start_date,
      end_date: promo.end_date,
      views_count: promo.views_count,
      clicks_count: promo.clicks_count,
      user_id: promo.user_id // Keep user_id for braider reference
    })) || []

    return NextResponse.json({ 
      success: true,
      promotions: processedPromotions,
      total: processedPromotions.length
    })

  } catch (error) {
    console.error('Error in GET /api/promotions/active:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
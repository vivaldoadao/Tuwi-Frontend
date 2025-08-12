import { NextRequest, NextResponse } from 'next/server'
import { getBraidersWithPromotions, getActiveHeroBanner, trackPromotionClick } from '@/lib/promotions-display'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const specialty = searchParams.get('specialty')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (type === 'hero') {
      // Buscar banner hero ativo
      const heroBanner = await getActiveHeroBanner()
      
      return NextResponse.json({
        success: true,
        hero_banner: heroBanner
      })
    }

    if (type === 'braiders' || !type) {
      // Buscar braiders com promoções
      const result = await getBraidersWithPromotions({
        limit,
        location: location || undefined,
        specialty: specialty || undefined
      })

      return NextResponse.json({
        success: true,
        promoted_braiders: result.promoted,
        regular_braiders: result.regular,
        total: result.total,
        has_promotions: result.promoted.length > 0
      })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use "hero" or "braiders"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching public promotions:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch promotions',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}

// Endpoint para tracking de cliques (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { promotion_id, action, metadata } = body

    if (!promotion_id || !action) {
      return NextResponse.json(
        { error: 'promotion_id and action are required' },
        { status: 400 }
      )
    }

    if (action === 'click') {
      await trackPromotionClick(promotion_id, metadata)
      
      return NextResponse.json({
        success: true,
        message: 'Click tracked successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "click"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error tracking promotion action:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to track action',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}
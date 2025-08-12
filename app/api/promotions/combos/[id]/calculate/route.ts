import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { promotionComboService } from '@/lib/promotion-combos'

/**
 * API para calcular preço final de um combo com cupom
 * 
 * POST /api/promotions/combos/[id]/calculate
 * 
 * Body:
 * {
 *   "coupon_code": "WELCOME10" (optional)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: comboId } = resolvedParams

    if (!comboId) {
      return NextResponse.json({
        success: false,
        error: 'Missing combo ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const { coupon_code } = body

    console.log('🧮 Calculating combo price:', { comboId, coupon_code, userId: session.user.id })

    // Calcular preço do combo
    const calculation = await promotionComboService.calculateComboPrice(
      comboId,
      coupon_code,
      session.user.id
    )

    if (!calculation) {
      return NextResponse.json({
        success: false,
        error: 'Combo not found or inactive'
      }, { status: 404 })
    }

    // Verificar se cupom foi aplicado e é válido
    let couponError = null
    if (coupon_code && calculation.coupon_discount === 0) {
      // Se foi fornecido cupom mas não há desconto, validar para obter erro específico
      const couponResult = await promotionComboService.validateAndApplyCoupon(
        coupon_code,
        session.user.id,
        calculation.combo.combo_price,
        'combo'
      )
      
      if (!couponResult.valid) {
        couponError = couponResult.error
      }
    }

    const response = {
      success: true,
      calculation: {
        combo: {
          id: calculation.combo.id,
          name: calculation.combo.name,
          description: calculation.combo.description,
          badge_text: calculation.combo.badge_text,
          highlight_color: calculation.combo.highlight_color,
          features: calculation.combo.features
        },
        pricing: {
          original_price: calculation.original_price,
          combo_discount: calculation.discount_amount,
          coupon_discount: calculation.coupon_discount || 0,
          final_price: calculation.final_price,
          total_savings: calculation.total_savings,
          currency: 'EUR'
        },
        promotions_included: calculation.promotions_to_create,
        coupon_applied: !!calculation.coupon_discount && calculation.coupon_discount > 0,
        coupon_error: couponError
      }
    }

    console.log('✅ Combo calculation completed:', response.calculation.pricing)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error calculating combo price:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate combo price',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { promotionComboService } from '@/lib/promotion-combos'

/**
 * API para combo específico
 * 
 * GET /api/promotions/combos/[id] - Obter combo por ID
 * PUT /api/promotions/combos/[id] - Atualizar combo (admin)
 * DELETE /api/promotions/combos/[id] - Remover combo (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing combo ID'
      }, { status: 400 })
    }

    const combo = await promotionComboService.getComboById(id)

    if (!combo) {
      return NextResponse.json({
        success: false,
        error: 'Combo not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      combo
    })

  } catch (error) {
    console.error('Error fetching combo:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch combo',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * PUT /api/promotions/combos/[id] - Atualizar combo (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
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

    const { id } = resolvedParams
    const body = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing combo ID'
      }, { status: 400 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Verificar se combo existe
    const { data: existingCombo, error: fetchError } = await supabase
      .from('promotion_combos')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCombo) {
      return NextResponse.json({
        success: false,
        error: 'Combo not found'
      }, { status: 404 })
    }

    // Atualizar combo
    const { data: updatedCombo, error: updateError } = await supabase
      .from('promotion_combos')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating combo:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update combo',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Combo updated successfully',
      combo: updatedCombo
    })

  } catch (error) {
    console.error('Error in PUT /api/promotions/combos/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * DELETE /api/promotions/combos/[id] - Remover combo (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
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

    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing combo ID'
      }, { status: 400 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Verificar se combo existe e se pode ser deletado
    const { data: combo, error: fetchError } = await supabase
      .from('promotion_combos')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !combo) {
      return NextResponse.json({
        success: false,
        error: 'Combo not found'
      }, { status: 404 })
    }

    // Verificar se há assinaturas ativas usando este combo
    const { data: activeSubscriptions, error: subscriptionsError } = await supabase
      .from('promotion_subscriptions')
      .select('id')
      .eq('combo_id', id)
      .in('status', ['trial', 'active'])

    if (subscriptionsError) {
      console.error('Error checking subscriptions:', subscriptionsError)
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete combo with active subscriptions',
        details: `${activeSubscriptions.length} active subscription(s) found`
      }, { status: 400 })
    }

    // Em vez de deletar, desativar combo
    const { error: deactivateError } = await supabase
      .from('promotion_combos')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (deactivateError) {
      console.error('Error deactivating combo:', deactivateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to deactivate combo',
        details: deactivateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Combo "${combo.name}" deactivated successfully`
    })

  } catch (error) {
    console.error('Error in DELETE /api/promotions/combos/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
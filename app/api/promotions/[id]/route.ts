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

// GET /api/promotions/[id] - Obter promoção específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    const serviceClient = getServiceClient()

    const { data: promotion, error } = await serviceClient
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
      .eq('id', id)
      .single()

    if (error || !promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Verificar permissão (próprio usuário, admin ou promoção pública ativa)
    const isOwner = session?.user?.id === promotion.user_id
    const isAdminUser = await isAdmin()
    const isPublicActive = promotion.status === 'active' && 
                          new Date(promotion.start_date) <= new Date() &&
                          new Date(promotion.end_date) > new Date()

    if (!isOwner && !isAdminUser && !isPublicActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Se não é o owner ou admin, remover informações sensíveis
    if (!isOwner && !isAdminUser) {
      delete promotion.payment_id
      delete promotion.stripe_session_id
      delete promotion.metadata
    }

    return NextResponse.json({ 
      success: true,
      promotion 
    })

  } catch (error) {
    console.error('Error fetching promotion:', error)
    return NextResponse.json({
      success: false, 
      error: 'Failed to fetch promotion'
    }, { status: 500 })
  }
}

// PUT /api/promotions/[id] - Atualizar promoção
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    
    // Verificar se promoção existe e permissões
    const { data: existingPromotion, error: fetchError } = await serviceClient
      .from('promotions')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingPromotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const isOwner = session.user.id === existingPromotion.user_id
    const isAdminUser = await isAdmin()

    if (!isOwner && !isAdminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    
    // Admin pode alterar qualquer coisa, usuário só pode alterar campos específicos
    let allowedFields = ['title', 'description', 'content_data']
    if (isAdminUser) {
      allowedFields = Object.keys(body).filter(key => 
        !['id', 'created_at', 'user_id'].includes(key)
      )
    }

    const updateData: any = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    updateData.updated_at = new Date().toISOString()

    const { data: updatedPromotion, error: updateError } = await serviceClient
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating promotion:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update promotion'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      promotion: updatedPromotion 
    })

  } catch (error) {
    console.error('Error updating promotion:', error)
    return NextResponse.json({
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/promotions/[id] - Cancelar promoção
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    
    // Verificar se promoção existe e permissões
    const { data: existingPromotion, error: fetchError } = await serviceClient
      .from('promotions')
      .select('user_id, status, title')
      .eq('id', id)
      .single()

    if (fetchError || !existingPromotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const isOwner = session.user.id === existingPromotion.user_id
    const isAdminUser = await isAdmin()

    if (!isOwner && !isAdminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Não deletar, apenas cancelar
    const { error: updateError } = await serviceClient
      .from('promotions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling promotion:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to cancel promotion'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Promotion "${existingPromotion.title}" cancelled successfully`
    })

  } catch (error) {
    console.error('Error cancelling promotion:', error)
    return NextResponse.json({
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
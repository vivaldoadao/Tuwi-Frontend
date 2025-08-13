import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/promotions/extend - Estender promoção existente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    
    // Buscar usuário por email
    const { data: currentUser, error: userError } = await serviceClient
      .from('users')
      .select('id, email, name, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }

    const body = await request.json()
    const { promotion_id, additional_days, package_id } = body

    if (!promotion_id || !additional_days) {
      return NextResponse.json({
        success: false,
        error: 'promotion_id e additional_days são obrigatórios'
      }, { status: 400 })
    }

    // Verificar se a promoção existe e pertence ao usuário
    const { data: promotion, error: promoError } = await serviceClient
      .from('promotions')
      .select('*')
      .eq('id', promotion_id)
      .eq('user_id', currentUser.id)
      .single()

    if (promoError || !promotion) {
      return NextResponse.json({
        success: false,
        error: 'Promoção não encontrada ou não autorizada'
      }, { status: 404 })
    }

    // Verificar se a promoção está ativa
    const now = new Date()
    const endDate = new Date(promotion.end_date)
    
    if (promotion.status !== 'active' || endDate <= now) {
      return NextResponse.json({
        success: false,
        error: 'Apenas promoções ativas podem ser estendidas'
      }, { status: 400 })
    }

    // Calcular nova data de término
    const newEndDate = new Date(endDate.getTime() + (additional_days * 24 * 60 * 60 * 1000))

    // Atualizar a promoção
    const { data: updatedPromotion, error: updateError } = await serviceClient
      .from('promotions')
      .update({
        end_date: newEndDate.toISOString(),
        metadata: {
          ...promotion.metadata,
          extended: true,
          extension_days: (promotion.metadata?.extension_days || 0) + additional_days,
          last_extended: new Date().toISOString(),
          extended_with_package: package_id || null
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', promotion_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error extending promotion:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Falha ao estender promoção'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Promoção estendida por ${additional_days} dias com sucesso!`,
      promotion: updatedPromotion,
      new_end_date: newEndDate.toLocaleDateString('pt-BR')
    })

  } catch (error) {
    console.error('Error in extend promotions API:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
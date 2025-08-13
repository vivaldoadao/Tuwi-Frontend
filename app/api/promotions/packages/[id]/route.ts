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

// GET /api/promotions/packages/[id] - Obter pacote específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceClient = getServiceClient()
    const { id } = params

    const { data: package_data, error } = await serviceClient
      .from('promotion_packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching package:', error)
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({ package: package_data })

  } catch (error) {
    console.error('Error in package GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/promotions/packages/[id] - Atualizar pacote específico (admin apenas)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const { id } = params
    const body = await request.json()

    const { data: updated, error } = await serviceClient
      .from('promotion_packages')
      .update({
        ...body,
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
    console.error('Error in package PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/promotions/packages/[id] - Deletar pacote (admin apenas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const { id } = params

    // Verificar se há promoções ativas usando este pacote
    const { data: activePromotions } = await serviceClient
      .from('promotions')
      .select('id')
      .eq('package_id', id)
      .eq('status', 'active')

    if (activePromotions && activePromotions.length > 0) {
      return NextResponse.json({ 
        error: `Não é possível deletar o pacote pois existem ${activePromotions.length} promoção(ões) ativa(s) utilizando-o. Primeiro desative as promoções ou desative o pacote ao invés de deletá-lo.`
      }, { status: 400 })
    }

    const { error } = await serviceClient
      .from('promotion_packages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting package:', error)
      return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Package deleted successfully' 
    })

  } catch (error) {
    console.error('Error in package DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
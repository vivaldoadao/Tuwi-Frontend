import { NextResponse } from 'next/server'
import { withAdmin, type AuthenticatedRequest } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/braiders - Get all braiders for admin management
export const GET = withAdmin(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected
    const limit = searchParams.get('limit')

    const supabase = await createClient()
    
    let query = supabase
      .from('braiders')
      .select(`
        *,
        users!braiders_user_id_fkey(name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: braiders, error } = await query

    if (error) {
      console.error('Error fetching braiders for admin:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar trancistas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ braiders: braiders || [] })
  } catch (error) {
    console.error('Unexpected error in admin braiders:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/admin/braiders - Update braider status (approve/reject)
export const PUT = withAdmin(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { braiderId, status, reason } = body

    if (!braiderId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('braiders')
      .update({ 
        status,
        review_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: request.user.id
      })
      .eq('id', braiderId)

    if (error) {
      console.error('Error updating braider status:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do trancista' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `Trancista ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso` 
    })
  } catch (error) {
    console.error('Unexpected error updating braider:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
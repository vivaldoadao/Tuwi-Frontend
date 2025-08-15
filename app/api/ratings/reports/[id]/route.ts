import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// PATCH - Atualizar status do report (apenas admins)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas admins' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, adminNotes, ratingAction } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'reviewed', 'dismissed', 'action_taken']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Buscar report atual
    const { data: report, error: fetchError } = await supabase
      .from('rating_reports')
      .select('*, ratings!inner(id, braider_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Reporte não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar report
    const updateData = {
      status,
      admin_notes: adminNotes || null,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('rating_reports')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      console.error('❌ Error updating report:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar reporte' },
        { status: 500 }
      )
    }

    // Ações sobre a avaliação baseadas na decisão
    if (status === 'action_taken' && ratingAction) {
      const ratingId = report.ratings.id
      
      switch (ratingAction) {
        case 'hide':
          await supabase
            .from('ratings')
            .update({ 
              status: 'hidden',
              flagged_reason: 'Ocultada por moderação',
              updated_at: new Date().toISOString()
            })
            .eq('id', ratingId)
          break
          
        case 'delete':
          await supabase
            .from('ratings')
            .update({ 
              status: 'deleted',
              flagged_reason: 'Removida por moderação',
              updated_at: new Date().toISOString()
            })
            .eq('id', ratingId)
          break
          
        case 'flag':
          await supabase
            .from('ratings')
            .update({ 
              status: 'flagged',
              flagged_reason: `Flagged por moderação: ${adminNotes || 'Sem detalhes'}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', ratingId)
          break
      }
      
      // Recalcular estatísticas da braider se ação afetou a avaliação
      if (['hide', 'delete'].includes(ratingAction)) {
        await supabase.rpc('update_braider_rating_stats', {
          p_braider_id: report.ratings.braider_id
        })
      }
    }

    // Buscar report atualizado com dados relacionados
    const { data: updatedReport } = await supabase
      .from('rating_reports')
      .select(`
        *,
        ratings!inner(
          id,
          overall_rating,
          review_title,
          review_text,
          client_name,
          status as rating_status,
          braiders!inner(name)
        ),
        reporter:users!reporter_id(name, email),
        reviewer:users!reviewed_by(name, email)
      `)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      message: 'Reporte atualizado com sucesso',
      report: updatedReport
    })

  } catch (error) {
    console.error('❌ Error in report PATCH:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas admins' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('rating_reports')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('❌ Error deleting report:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar reporte' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Reporte removido com sucesso'
    })

  } catch (error) {
    console.error('❌ Error in report DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
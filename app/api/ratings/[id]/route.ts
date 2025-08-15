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

// GET - Buscar rating específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: rating, error } = await supabase
      .from('ratings')
      .select(`
        *,
        braiders!inner(id, name, user_id, average_rating, bio, location),
        services(id, name, price, description),
        bookings(id, booking_date, booking_time, status)
      `)
      .eq('id', params.id)
      .eq('status', 'active')
      .single()

    if (error || !rating) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ rating })

  } catch (error) {
    console.error('❌ Error fetching rating:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar rating
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Buscar rating atual
    const { data: currentRating, error: fetchError } = await supabase
      .from('ratings')
      .select(`
        *,
        braiders!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !currentRating) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const isOwner = currentRating.client_id === session.user.id
    const isBraider = currentRating.braiders.user_id === session.user.id
    const isAdmin = session.user.role === 'admin'

    if (!isOwner && !isBraider && !isAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar esta avaliação' },
        { status: 403 }
      )
    }

    // Cliente pode atualizar apenas dentro de 7 dias
    if (isOwner && !isAdmin) {
      const createdAt = new Date(currentRating.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (createdAt < sevenDaysAgo) {
        return NextResponse.json(
          { error: 'Avaliação só pode ser editada até 7 dias após criação' },
          { status: 403 }
        )
      }
    }

    let updateData: any = {}

    // Cliente pode atualizar: ratings, título, texto, imagens
    if (isOwner && !isAdmin) {
      const {
        overallRating,
        qualityRating,
        punctualityRating,
        communicationRating,
        professionalismRating,
        reviewTitle,
        reviewText,
        reviewImages
      } = body

      if (overallRating !== undefined) {
        if (overallRating < 1 || overallRating > 5) {
          return NextResponse.json(
            { error: 'Rating deve estar entre 1 e 5' },
            { status: 400 }
          )
        }
        updateData.overall_rating = overallRating
      }

      if (qualityRating !== undefined) updateData.quality_rating = qualityRating
      if (punctualityRating !== undefined) updateData.punctuality_rating = punctualityRating
      if (communicationRating !== undefined) updateData.communication_rating = communicationRating
      if (professionalismRating !== undefined) updateData.professionalism_rating = professionalismRating
      if (reviewTitle !== undefined) updateData.review_title = reviewTitle
      if (reviewText !== undefined) updateData.review_text = reviewText
      if (reviewImages !== undefined) updateData.review_images = reviewImages
    }

    // Braider pode responder
    if (isBraider && !isOwner) {
      const { braiderResponse } = body
      if (braiderResponse !== undefined) {
        updateData.braider_response = braiderResponse
        updateData.braider_response_date = new Date().toISOString()
      }
    }

    // Admin pode atualizar status e moderação
    if (isAdmin) {
      const { status, flaggedReason } = body
      if (status !== undefined) updateData.status = status
      if (flaggedReason !== undefined) updateData.flagged_reason = flaggedReason
      
      // Admin também pode atualizar outros campos
      Object.assign(updateData, body)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    // Atualizar rating
    const { data: updatedRating, error: updateError } = await supabase
      .from('ratings')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        braiders!inner(id, name, user_id, average_rating),
        services(id, name),
        bookings(id, booking_date, booking_time, status)
      `)
      .single()

    if (updateError) {
      console.error('❌ Error updating rating:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar avaliação' },
        { status: 500 }
      )
    }

    // Recalcular estatísticas se rating foi alterado
    if (updateData.overall_rating !== undefined || updateData.status !== undefined) {
      await supabase.rpc('update_braider_rating_stats', {
        p_braider_id: currentRating.braider_id
      })
    }

    // Notificar via WebSocket se foi resposta da braider
    if (updateData.braider_response) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/socket/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rating_response',
            ratingId: params.id,
            braiderId: currentRating.braider_id,
            clientId: currentRating.client_id,
            response: updateData.braider_response
          })
        })
      } catch (notifyError) {
        console.warn('⚠️ Failed to send WebSocket notification:', notifyError)
      }
    }

    return NextResponse.json({
      message: 'Avaliação atualizada com sucesso',
      rating: updatedRating
    })

  } catch (error) {
    console.error('❌ Error in ratings PATCH:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover rating (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    // Buscar rating
    const { data: rating, error: fetchError } = await supabase
      .from('ratings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !rating) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões (só owner ou admin)
    if (rating.client_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para deletar esta avaliação' },
        { status: 403 }
      )
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('ratings')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (deleteError) {
      console.error('❌ Error deleting rating:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar avaliação' },
        { status: 500 }
      )
    }

    // Recalcular estatísticas
    await supabase.rpc('update_braider_rating_stats', {
      p_braider_id: rating.braider_id
    })

    return NextResponse.json({
      message: 'Avaliação removida com sucesso'
    })

  } catch (error) {
    console.error('❌ Error in ratings DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
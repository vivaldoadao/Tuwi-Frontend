import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Usar createClient para operações administrativas
const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Buscar ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const braiderId = searchParams.get('braiderId')
    const clientId = searchParams.get('clientId')
    const bookingId = searchParams.get('bookingId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeStats = searchParams.get('includeStats') === 'true'

    const supabase = await createClient()
    
    let query = supabase
      .from('ratings')
      .select(`
        *,
        braiders!inner(id, name, user_id, average_rating),
        services(id, name, price),
        bookings(id, booking_date, booking_time, status)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Filtros condicionais
    if (braiderId) {
      query = query.eq('braider_id', braiderId)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data: ratings, error, count } = await query

    if (error) {
      console.error('❌ Error fetching ratings:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    let stats = null
    if (includeStats && braiderId) {
      const { data: statsData } = await supabase
        .from('braider_rating_stats')
        .select('*')
        .eq('braider_id', braiderId)
        .single()
      
      stats = statsData
    }

    return NextResponse.json({
      ratings: ratings || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ Error in ratings GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar rating
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // SEGURANÇA NA API: Buscar user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User validation failed' }, { status: 400 })
    }

    const body = await request.json()
    const {
      braiderId,
      bookingId,
      serviceId,
      overallRating,
      qualityRating,
      punctualityRating,
      communicationRating,
      professionalismRating,
      reviewTitle,
      reviewText,
      clientName,
      clientEmail,
      reviewImages
    } = body

    // Validações básicas
    if (!braiderId || !overallRating) {
      return NextResponse.json(
        { error: 'braiderId e overallRating são obrigatórios' },
        { status: 400 }
      )
    }

    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: 'Rating deve estar entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verificar se booking existe e foi completado (se informado)
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, client_id, braider_id, status')
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: 'Booking não encontrado' },
          { status: 404 }
        )
      }

      if (booking.status !== 'completed') {
        return NextResponse.json(
          { error: 'Só é possível avaliar bookings completados' },
          { status: 400 }
        )
      }

      if (booking.client_id !== userData.id) {
        return NextResponse.json(
          { error: 'Você só pode avaliar seus próprios bookings' },
          { status: 403 }
        )
      }

      // Verificar se já existe rating para este booking
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('booking_id', bookingId)
        .single()

      if (existingRating) {
        return NextResponse.json(
          { error: 'Booking já foi avaliado' },
          { status: 409 }
        )
      }
    }

    // Criar rating
    const { data: rating, error: insertError } = await supabase
      .from('ratings')
      .insert({
        braider_id: braiderId,
        client_id: userData.id,
        booking_id: bookingId || null,
        service_id: serviceId || null,
        overall_rating: overallRating,
        quality_rating: qualityRating || null,
        punctuality_rating: punctualityRating || null,
        communication_rating: communicationRating || null,
        professionalism_rating: professionalismRating || null,
        review_title: reviewTitle || null,
        review_text: reviewText || null,
        client_name: clientName || userData.name || 'Cliente Anônimo',
        client_email: clientEmail || userData.email,
        review_images: reviewImages || [],
        status: 'active',
        is_verified: !!bookingId
      })
      .select(`
        *,
        braiders!inner(id, name, average_rating),
        services(id, name)
      `)
      .single()

    if (insertError) {
      console.error('❌ Error creating rating:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar avaliação' },
        { status: 500 }
      )
    }

    // Recalcular estatísticas da braider usando adminSupabase para RPC
    await adminSupabase.rpc('update_braider_rating_stats', {
      p_braider_id: braiderId
    })

    // Notificar via WebSocket se disponível
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/socket/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rating_created',
          braiderId,
          ratingId: rating.id,
          rating: overallRating,
          clientName: rating.client_name
        })
      })
    } catch (notifyError) {
      console.warn('⚠️ Failed to send WebSocket notification:', notifyError)
    }

    return NextResponse.json(
      {
        message: 'Avaliação criada com sucesso',
        rating
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Error in ratings POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
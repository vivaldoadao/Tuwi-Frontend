import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET - Ratings de uma braider específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeStats = searchParams.get('includeStats') === 'true'
    const minRating = searchParams.get('minRating')
    const maxRating = searchParams.get('maxRating')
    const hasImages = searchParams.get('hasImages')
    const verified = searchParams.get('verified')

    // Verificar se braider existe
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, name, average_rating, total_reviews')
      .eq('id', params.id)
      .single()

    if (braiderError || !braider) {
      return NextResponse.json(
        { error: 'Braider não encontrada' },
        { status: 404 }
      )
    }

    // Query de ratings
    let ratingsQuery = supabase
      .from('ratings')
      .select(`
        id,
        overall_rating,
        quality_rating,
        punctuality_rating,
        communication_rating,
        professionalism_rating,
        review_title,
        review_text,
        client_name,
        review_images,
        is_verified,
        braider_response,
        braider_response_date,
        created_at,
        services(id, name, price),
        bookings(id, booking_date, booking_time)
      `, { count: 'exact' })
      .eq('braider_id', params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Filtros opcionais
    if (minRating) {
      ratingsQuery = ratingsQuery.gte('overall_rating', parseInt(minRating))
    }
    if (maxRating) {
      ratingsQuery = ratingsQuery.lte('overall_rating', parseInt(maxRating))
    }
    if (hasImages === 'true') {
      ratingsQuery = ratingsQuery.not('review_images', 'is', null)
      ratingsQuery = ratingsQuery.neq('review_images', '{}')
    }
    if (verified === 'true') {
      ratingsQuery = ratingsQuery.eq('is_verified', true)
    }

    // Paginação
    ratingsQuery = ratingsQuery.range(offset, offset + limit - 1)

    const { data: ratings, error: ratingsError, count } = await ratingsQuery

    if (ratingsError) {
      console.error('❌ Error fetching ratings:', ratingsError)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    let stats = null
    if (includeStats) {
      // Buscar estatísticas detalhadas
      const { data: statsData } = await supabase
        .from('braider_rating_stats')
        .select('*')
        .eq('braider_id', params.id)
        .single()

      // Calcular estatísticas adicionais se necessário
      if (statsData) {
        stats = {
          ...statsData,
          braider_info: {
            id: braider.id,
            name: braider.name,
            average_rating: braider.average_rating,
            total_reviews: braider.total_reviews
          }
        }
      } else {
        // Calcular estatísticas básicas se não existir tabela de stats
        const { data: basicStats } = await supabase
          .from('ratings')
          .select('overall_rating')
          .eq('braider_id', params.id)
          .eq('status', 'active')

        if (basicStats && basicStats.length > 0) {
          const ratings_array = basicStats.map(r => r.overall_rating)
          const total = ratings_array.length
          const average = ratings_array.reduce((a, b) => a + b, 0) / total

          stats = {
            braider_id: params.id,
            total_ratings: total,
            average_rating: parseFloat(average.toFixed(2)),
            rating_1_count: ratings_array.filter(r => r === 1).length,
            rating_2_count: ratings_array.filter(r => r === 2).length,
            rating_3_count: ratings_array.filter(r => r === 3).length,
            rating_4_count: ratings_array.filter(r => r === 4).length,
            rating_5_count: ratings_array.filter(r => r === 5).length,
            braider_info: {
              id: braider.id,
              name: braider.name,
              average_rating: braider.average_rating,
              total_reviews: braider.total_reviews
            }
          }
        }
      }
    }

    return NextResponse.json({
      braider: {
        id: braider.id,
        name: braider.name,
        average_rating: braider.average_rating,
        total_reviews: braider.total_reviews
      },
      ratings: ratings || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      filters_applied: {
        minRating: minRating ? parseInt(minRating) : null,
        maxRating: maxRating ? parseInt(maxRating) : null,
        hasImages: hasImages === 'true',
        verified: verified === 'true'
      }
    })

  } catch (error) {
    console.error('❌ Error in braider ratings GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
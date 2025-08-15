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

// GET - Listar reports (apenas admins)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas admins' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('rating_reports')
      .select(`
        *,
        ratings!inner(
          id,
          overall_rating,
          review_title,
          review_text,
          client_name,
          created_at,
          braiders!inner(id, name)
        ),
        reporter:users!reporter_id(id, name, email),
        reviewer:users!reviewed_by(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('❌ Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar reportes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ Error in reports GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ratingId, reason, description } = body

    // Validações
    if (!ratingId || !reason) {
      return NextResponse.json(
        { error: 'ratingId e reason são obrigatórios' },
        { status: 400 }
      )
    }

    const validReasons = [
      'inappropriate_content',
      'fake_review',
      'spam',
      'harassment',
      'off_topic',
      'other'
    ]

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Motivo inválido' },
        { status: 400 }
      )
    }

    // Verificar se rating existe
    const { data: rating, error: ratingError } = await supabase
      .from('ratings')
      .select('id, status')
      .eq('id', ratingId)
      .single()

    if (ratingError || !rating) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se usuário já reportou esta avaliação
    const { data: existingReport } = await supabase
      .from('rating_reports')
      .select('id')
      .eq('rating_id', ratingId)
      .eq('reporter_id', session.user.id)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'Você já reportou esta avaliação' },
        { status: 409 }
      )
    }

    // Criar report
    const { data: report, error: insertError } = await supabase
      .from('rating_reports')
      .insert({
        rating_id: ratingId,
        reporter_id: session.user.id,
        reason,
        description: description || null,
        status: 'pending'
      })
      .select(`
        *,
        ratings!inner(
          id,
          overall_rating,
          review_title,
          client_name,
          braiders!inner(name)
        )
      `)
      .single()

    if (insertError) {
      console.error('❌ Error creating report:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar reporte' },
        { status: 500 }
      )
    }

    // Se muitos reports, flaggar automaticamente a avaliação
    const { data: reportCount } = await supabase
      .from('rating_reports')
      .select('id', { count: 'exact' })
      .eq('rating_id', ratingId)
      .eq('status', 'pending')

    if ((reportCount?.length || 0) >= 3) {
      await supabase
        .from('ratings')
        .update({ 
          status: 'flagged',
          flagged_reason: 'Múltiplos reports de usuários',
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)
    }

    return NextResponse.json(
      {
        message: 'Reporte enviado com sucesso',
        report
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Error in reports POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/admin/braiders-list - Get all braiders for admin dashboard
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const serviceSupabase = getServiceClient()

    // Build the query
    let query = serviceSupabase
      .from('braiders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add status filter if provided
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%,location.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: braiders, error, count } = await query

    if (error) {
      console.error('Error fetching braiders:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar trancistas' },
        { status: 500 }
      )
    }

    // Get all users with braider role to match emails and get additional info
    const { data: allUsers } = await serviceSupabase
      .from('users')
      .select('id, name, email, avatar_url, role')
      .eq('role', 'braider')

    // Create a map of email to user data
    const usersMap = new Map()
    if (allUsers) {
      allUsers.forEach(user => {
        usersMap.set(user.email, user)
      })
    }

    // Transform braiders data with user information
    const transformedBraiders = (braiders || []).map(braider => {
      const userData = usersMap.get(braider.contact_email)
      
      return {
        id: braider.id,
        name: braider.name || userData?.name || `Trancista ${braider.id.slice(0, 8)}`,
        bio: braider.bio || '',
        location: braider.location || 'Localização não informada',
        contactEmail: braider.contact_email || '',
        contactPhone: braider.contact_phone || '',
        profileImageUrl: userData?.avatar_url || '/placeholder.svg?height=200&width=200&text=T',
        whatsapp: braider.whatsapp || '',
        instagram: braider.instagram || '',
        district: braider.district || '',
        concelho: braider.concelho || '',
        freguesia: braider.freguesia || '',
        address: braider.address || '',
        postalCode: braider.postal_code || '',
        servesHome: braider.serves_home || false,
        servesStudio: braider.serves_studio || false,
        servesSalon: braider.serves_salon || false,
        maxTravelDistance: braider.max_travel_distance || 0,
        salonName: braider.salon_name || '',
        salonAddress: braider.salon_address || '',
        specialties: braider.specialties || [],
        yearsExperience: braider.years_experience || '',
        certificates: braider.certificates || '',
        minPrice: braider.min_price || 0,
        maxPrice: braider.max_price || 0,
        availability: braider.weekly_availability || {},
        services: [], // Could be loaded separately if needed
        portfolioImages: braider.portfolio_images || [],
        status: braider.status || 'pending',
        averageRating: parseFloat(braider.average_rating || '0'),
        totalReviews: parseInt(braider.total_reviews || '0'),
        createdAt: braider.created_at || new Date().toISOString(),
        userId: userData?.id || null
      }
    })

    const hasMore = count ? (page * limit) < count : false

    return NextResponse.json({
      braiders: transformedBraiders,
      total: count || 0,
      hasMore,
      page,
      limit
    })
  } catch (error) {
    console.error('Unexpected error in admin braiders list:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/braiders-list - Update braider status
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { braiderId, status, reason } = body

    if (!braiderId || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const serviceSupabase = getServiceClient()

    const { error } = await serviceSupabase
      .from('braiders')
      .update({ 
        status,
        review_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id
      })
      .eq('id', braiderId)

    if (error) {
      console.error('Error updating braider status:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status da trancista' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `Trancista ${status === 'approved' ? 'aprovada' : status === 'rejected' ? 'rejeitada' : 'marcada como pendente'} com sucesso` 
    })
  } catch (error) {
    console.error('Unexpected error updating braider:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
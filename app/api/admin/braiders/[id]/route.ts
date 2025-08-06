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

// GET /api/admin/braiders/[id] - Get single braider for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const braiderId = params.id
    if (!braiderId) {
      return NextResponse.json(
        { error: 'ID da trancista é obrigatório' },
        { status: 400 }
      )
    }

    const serviceSupabase = getServiceClient()

    // Get braider data
    const { data: braider, error } = await serviceSupabase
      .from('braiders')
      .select('*')
      .eq('id', braiderId)
      .single()

    if (error) {
      console.error('Error fetching braider:', error)
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Trancista não encontrada' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao buscar trancista' },
        { status: 500 }
      )
    }

    // Get user data if exists
    let userData = null
    if (braider.contact_email) {
      const { data: user } = await serviceSupabase
        .from('users')
        .select('id, name, email, avatar_url, role')
        .eq('email', braider.contact_email)
        .eq('role', 'braider')
        .single()
      
      userData = user
    }

    // Get services for this braider
    const { data: services } = await serviceSupabase
      .from('services')
      .select('*')
      .eq('braider_id', braiderId)

    // Transform braider data
    const transformedBraider = {
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
      services: (services || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        price: parseFloat(service.price || 0),
        durationMinutes: service.duration_minutes || 0,
        description: service.description || '',
        imageUrl: service.image_url || '/placeholder.svg'
      })),
      portfolioImages: braider.portfolio_images || [],
      status: braider.status || 'pending',
      averageRating: parseFloat(braider.average_rating || '0'),
      totalReviews: parseInt(braider.total_reviews || '0'),
      createdAt: braider.created_at || new Date().toISOString(),
      updatedAt: braider.updated_at || null,
      userId: userData?.id || null
    }

    return NextResponse.json({ braider: transformedBraider })
  } catch (error) {
    console.error('Unexpected error fetching braider:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/braiders/[id] - Update braider status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const braiderId = params.id
    const body = await request.json()
    const { status, reason } = body

    if (!braiderId) {
      return NextResponse.json(
        { error: 'ID da trancista é obrigatório' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
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
        reviewed_by: session.user.id,
        updated_at: new Date().toISOString()
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
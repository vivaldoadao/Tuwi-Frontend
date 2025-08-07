import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import { sendBraiderApprovalEmail, sendBraiderRejectionEmail } from '@/lib/email-service'

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
  { params }: { params: Promise<{ id: string }> }
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

    const resolvedParams = await params
    const braiderId = resolvedParams.id
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
  { params }: { params: Promise<{ id: string }> }
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

    const resolvedParams = await params
    const braiderId = resolvedParams.id
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

    // Get braider data first for email notification
    const { data: braiderData, error: fetchError } = await serviceSupabase
      .from('braiders')
      .select('name, contact_email, created_at')
      .eq('id', braiderId)
      .single()

    if (fetchError) {
      console.error('Error fetching braider data:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados da trancista' },
        { status: 500 }
      )
    }

    // Update braider status
    const { error } = await serviceSupabase
      .from('braiders')
      .update({ 
        status,
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

    // Update user role when braider is approved
    if (status === 'approved' && braiderData.contact_email) {
      try {
        const { error: userUpdateError } = await serviceSupabase
          .from('users')
          .update({ 
            role: 'braider',
            updated_at: new Date().toISOString()
          })
          .eq('email', braiderData.contact_email)

        if (userUpdateError) {
          console.error('Error updating user role to braider:', userUpdateError)
          // Log error but don't fail the braider approval
        } else {
          console.log('✅ User role updated to braider for:', braiderData.contact_email)
        }
      } catch (roleUpdateError) {
        console.error('Unexpected error updating user role:', roleUpdateError)
        // Log error but don't fail the braider approval
      }
    }

    // Update user role back to customer when braider is rejected
    if (status === 'rejected' && braiderData.contact_email) {
      try {
        const { error: userUpdateError } = await serviceSupabase
          .from('users')
          .update({ 
            role: 'customer',
            updated_at: new Date().toISOString()
          })
          .eq('email', braiderData.contact_email)

        if (userUpdateError) {
          console.error('Error updating user role back to customer:', userUpdateError)
          // Log error but don't fail the braider rejection
        } else {
          console.log('✅ User role updated back to customer for:', braiderData.contact_email)
        }
      } catch (roleUpdateError) {
        console.error('Unexpected error updating user role:', roleUpdateError)
        // Log error but don't fail the braider rejection
      }
    }

    // Send email notification based on status
    if (braiderData.contact_email) {
      try {
        const submissionDate = braiderData.created_at
        const reviewDate = new Date().toISOString()
        
        if (status === 'approved') {
          await sendBraiderApprovalEmail(
            braiderData.contact_email,
            braiderData.name || 'Trancista',
            submissionDate,
            reviewDate
          )
          console.log('✅ Approval email sent to:', braiderData.contact_email)
        } else if (status === 'rejected') {
          await sendBraiderRejectionEmail(
            braiderData.contact_email,
            braiderData.name || 'Trancista',
            reason,
            submissionDate,
            reviewDate
          )
          console.log('✅ Rejection email sent to:', braiderData.contact_email)
        }
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError)
        // Don't fail the status update if email fails
      }
    }

    // Generate success message
    let successMessage = ''
    if (status === 'approved') {
      successMessage = 'Trancista aprovada com sucesso! A usuária agora tem acesso ao dashboard de trancistas.'
    } else if (status === 'rejected') {
      successMessage = 'Trancista rejeitada com sucesso! A usuária voltou ao perfil de cliente.'
    } else {
      successMessage = 'Status da trancista atualizado com sucesso'
    }

    return NextResponse.json({ 
      success: true, 
      message: successMessage
    })
  } catch (error) {
    console.error('Unexpected error updating braider:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
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

// Get user ID from NextAuth session
async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.log('❌ No session or user ID found')
      return null
    }
    console.log('✅ User ID from session:', session.user.id)
    return session.user.id
  } catch (error) {
    console.error('❌ Error getting session:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Getting braider profile from database...')
    
    // Get email from query parameter
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      // Try to get from session as fallback
      const userId = await getUserIdFromSession()
      
      if (!userId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Não autorizado - email ou sessão não encontrada' 
        }, { status: 401 })
      }
    }
    
    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()
    
    let userId: string | null = null
    let userData: any = null
    
    if (email) {
      // Search by email
      const { data: userByEmail, error: emailError } = await serviceSupabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
        
      if (emailError || !userByEmail) {
        return NextResponse.json({ 
          success: false, 
          message: 'Usuário não encontrado com este email' 
        }, { status: 404 })
      }
      
      userData = userByEmail
      userId = userByEmail.id
      
    } else {
      // Use userId from session (fallback)
      const sessionUserId = await getUserIdFromSession()
      if (!sessionUserId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Não autorizado - sessão não encontrada' 
        }, { status: 401 })
      }
      userId = sessionUserId
    }
    
    // Get braider data - try by email first, then by user_id as fallback
    let braiderData = null
    let braiderError = null
    
    if (email) {
      // Try by contact_email first
      const { data: braiderByEmail, error: emailBraiderError } = await serviceSupabase
        .from('braiders')
        .select('*')
        .eq('contact_email', email)
        .single()
      
      braiderData = braiderByEmail
      braiderError = emailBraiderError
      
      console.log('🔍 Braider search by email result:', { braiderData: !!braiderData, error: braiderError })
    }
    
    // If not found by email or no email provided, try by user_id
    if (!braiderData && userId) {
      const { data: braiderByUserId, error: userIdBraiderError } = await serviceSupabase
        .from('braiders')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      braiderData = braiderByUserId
      braiderError = userIdBraiderError
      
      console.log('🔍 Braider search by user_id result:', { braiderData: !!braiderData, error: braiderError })
    }

    if (braiderError) {
      if (braiderError.code === 'PGRST116') {
        console.log('⚠️ No braider profile found for user:', userId)
        return NextResponse.json({ 
          success: false, 
          message: 'Perfil de trancista não encontrado. Você precisa se registrar como trancista primeiro.',
          data: null
        }, { status: 404 })
      } else {
        console.error('❌ Error fetching braider:', braiderError)
        return NextResponse.json({ 
          success: false, 
          message: 'Erro ao buscar dados da trancista' 
        }, { status: 500 })
      }
    }

    console.log('✅ Braider found:', braiderData.id, 'Status:', braiderData.status)

    // Get user data if not already loaded
    if (!userData) {
      const { data: userDataFromDb, error: userError } = await serviceSupabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('❌ Error fetching user data:', userError)
      } else {
        userData = userDataFromDb
      }
    }

    // Get services for this braider
    const { data: servicesData, error: servicesError } = await serviceSupabase
      .from('services')
      .select('*')
      .eq('braider_id', braiderData.id)

    if (servicesError) {
      console.error('⚠️ Error fetching services:', servicesError)
    }

    console.log('📊 Found', servicesData?.length || 0, 'services for braider')

    // Map database data to expected format
    const braiderProfile = {
      id: braiderData.id,
      name: braiderData.name || userData?.name || `Trancista ${braiderData.id.slice(0, 8)}`,
      bio: braiderData.bio || 'Sem biografia definida',
      location: braiderData.location || 'Localização não informada',
      contactEmail: braiderData.contact_email || userData?.email || '',
      contactPhone: braiderData.contact_phone || '',
      profileImageUrl: braiderData.profile_image_url || '/placeholder.svg?height=200&width=200&text=T',
      services: (servicesData || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        price: parseFloat(service.price || 0),
        durationMinutes: service.duration_minutes || 0,
        description: service.description || '',
        imageUrl: service.image_url || '/placeholder.svg'
      })),
      portfolioImages: braiderData.portfolio_images || [],
      status: braiderData.status || 'pending',
      averageRating: parseFloat(braiderData.average_rating || '0'),
      totalReviews: parseInt(braiderData.total_reviews || '0'),
      createdAt: braiderData.created_at || new Date().toISOString(),
      whatsapp: braiderData.whatsapp,
      instagram: braiderData.instagram,
      district: braiderData.district,
      concelho: braiderData.concelho,
      freguesia: braiderData.freguesia,
      address: braiderData.address,
      postalCode: braiderData.postal_code,
      servesHome: braiderData.serves_home || false,
      servesStudio: braiderData.serves_studio || false,
      servesSalon: braiderData.serves_salon || false,
      maxTravelDistance: braiderData.max_travel_distance || 10,
      salonName: braiderData.salon_name,
      salonAddress: braiderData.salon_address,
      specialties: braiderData.specialties || [],
      yearsExperience: braiderData.years_experience,
      certificates: braiderData.certificates,
      minPrice: braiderData.min_price ? parseFloat(braiderData.min_price) : null,
      maxPrice: braiderData.max_price ? parseFloat(braiderData.max_price) : null,
      weeklyAvailability: braiderData.weekly_availability || {}
    }

    console.log('✅ Returning braider profile for:', braiderProfile.name)
    
    return NextResponse.json({ 
      success: true, 
      data: braiderProfile 
    })
  } catch (error) {
    console.error('💥 Unexpected error getting braider profile:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 Updating braider profile in database...')
    
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autorizado - sessão não encontrada' 
      }, { status: 401 })
    }

    const profileData = await request.json()
    console.log('📝 Profile data received for user:', userId)
    
    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()
    
    // First get the braider to find the braider ID
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    if (braiderError || !braiderData) {
      console.error('❌ Error fetching braider for update:', braiderError)
      return NextResponse.json({ 
        success: false, 
        message: 'Trancista não encontrada. Você precisa se registrar como trancista primeiro.' 
      }, { status: 404 })
    }

    console.log('✅ Found braider to update:', braiderData.id)

    // Update braider table
    const braiderUpdateData: any = {
      updated_at: new Date().toISOString()
    }

    // Map frontend field names to database field names
    if (profileData.name !== undefined) braiderUpdateData.name = profileData.name
    if (profileData.bio !== undefined) braiderUpdateData.bio = profileData.bio
    if (profileData.location !== undefined) braiderUpdateData.location = profileData.location
    if (profileData.contactEmail !== undefined) braiderUpdateData.contact_email = profileData.contactEmail
    if (profileData.contactPhone !== undefined) braiderUpdateData.contact_phone = profileData.contactPhone
    if (profileData.whatsapp !== undefined) braiderUpdateData.whatsapp = profileData.whatsapp
    if (profileData.instagram !== undefined) braiderUpdateData.instagram = profileData.instagram
    if (profileData.district !== undefined) braiderUpdateData.district = profileData.district
    if (profileData.concelho !== undefined) braiderUpdateData.concelho = profileData.concelho
    if (profileData.freguesia !== undefined) braiderUpdateData.freguesia = profileData.freguesia
    if (profileData.address !== undefined) braiderUpdateData.address = profileData.address
    if (profileData.postalCode !== undefined) braiderUpdateData.postal_code = profileData.postalCode

    const { error: braiderUpdateError } = await serviceSupabase
      .from('braiders')
      .update(braiderUpdateData)
      .eq('id', braiderData.id)

    if (braiderUpdateError) {
      console.error('❌ Error updating braider:', braiderUpdateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar dados da trancista: ' + braiderUpdateError.message 
      }, { status: 500 })
    }

    // Update user table if name or email changed
    if (profileData.name !== undefined || profileData.contactEmail !== undefined) {
      const userUpdateData: any = {
        updated_at: new Date().toISOString()
      }

      if (profileData.name !== undefined) userUpdateData.name = profileData.name
      if (profileData.contactEmail !== undefined) userUpdateData.email = profileData.contactEmail

      const { error: userUpdateError } = await serviceSupabase
        .from('users')
        .update(userUpdateData)
        .eq('id', userId)

      if (userUpdateError) {
        console.error('⚠️ Error updating user info:', userUpdateError)
      } else {
        console.log('✅ User info updated successfully')
      }
    }

    console.log('✅ Profile updated successfully for braider:', braiderData.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Perfil atualizado com sucesso!' 
    })
  } catch (error) {
    console.error('💥 Unexpected error updating braider profile:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
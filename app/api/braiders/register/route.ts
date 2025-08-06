import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBraiderRegistration } from '@/lib/validations/braider'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting braider registration...')
    
    const braiderData = await request.json()
    console.log('📝 Received data:', { ...braiderData, contactEmail: '***' })
    
    // Server-side validation usando Zod
    console.log('🔍 Starting validation...')
    console.log('📊 Data types:', {
      name: typeof braiderData.name,
      bio: typeof braiderData.bio,
      contactEmail: typeof braiderData.contactEmail,
      servesHome: typeof braiderData.servesHome,
      specialties: Array.isArray(braiderData.specialties) ? 'array' : typeof braiderData.specialties,
      yearsExperience: typeof braiderData.yearsExperience,
      minPrice: typeof braiderData.minPrice,
      maxPrice: typeof braiderData.maxPrice,
      availability: typeof braiderData.availability
    })
    
    const validation = validateBraiderRegistration(braiderData)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors)
      console.log('📋 First 3 errors:')
      validation.error.errors.slice(0, 3).forEach((err, i) => {
        console.log(`  ${i + 1}. Path: ${err.path.join('.')}, Message: ${err.message}`)
      })
      
      const firstError = validation.error.errors[0]
      return NextResponse.json({ 
        success: false, 
        message: `Erro de validação: ${firstError.message}`,
        errors: validation.error.errors.slice(0, 5) // Only send first 5 errors
      }, { status: 400 })
    }
    
    console.log('✅ Validation successful')
    // Use validated data
    const validatedData = validation.data
    
    // Use service client to bypass RLS
    console.log('🔧 Creating service client...')
    const serviceSupabase = getServiceClient()
    
    // Check if braider with this email already exists
    console.log('🔍 Checking existing braider...')
    const { data: existingBraider, error: checkError } = await serviceSupabase
      .from('braiders')
      .select('id, status, contact_email')
      .eq('contact_email', validatedData.contactEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // Not "no rows returned"
      console.error('❌ Error checking existing braider:', checkError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao verificar dados existentes. Tente novamente.' 
      }, { status: 500 })
    }

    console.log('📊 Existing braider check result:', existingBraider ? 'Found' : 'Not found')

    // If braider exists and is not rejected, prevent duplicate
    if (existingBraider && existingBraider.status !== 'rejected') {
      return NextResponse.json({ 
        success: false, 
        message: 'Já existe um cadastro de trancista com este email. Se você foi rejeitada anteriormente, pode tentar novamente.' 
      }, { status: 400 })
    }

    // Prepare data for database insertion using validated data
    const insertData = {
      name: validatedData.name, // TODO: Add name column to braiders table first
      contact_email: validatedData.contactEmail,
      contact_phone: validatedData.contactPhone,
      bio: validatedData.bio,
      location: validatedData.location,
      whatsapp: validatedData.whatsapp || null,
      instagram: validatedData.instagram || null,
      district: validatedData.district || null,
      concelho: validatedData.concelho || null,
      freguesia: validatedData.freguesia || null,
      address: validatedData.address || null,
      postal_code: validatedData.postalCode || null,
      serves_home: validatedData.servesHome || false,
      serves_studio: validatedData.servesStudio || false,
      serves_salon: validatedData.servesSalon || false,
      max_travel_distance: validatedData.maxTravelDistance || 10,
      salon_name: validatedData.salonName || null,
      salon_address: validatedData.salonAddress || null,
      specialties: validatedData.specialties || [],
      years_experience: validatedData.yearsExperience || null,
      certificates: validatedData.certificates || null,
      min_price: validatedData.minPrice || null,
      max_price: validatedData.maxPrice || null,
      weekly_availability: validatedData.availability || {},
      status: 'pending'
    }

    let result
    if (existingBraider && existingBraider.status === 'rejected') {
      // Update existing rejected braider
      const { data, error } = await serviceSupabase
        .from('braiders')
        .update(insertData)
        .eq('id', existingBraider.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Insert new braider
      const { data, error } = await serviceSupabase
        .from('braiders')
        .insert(insertData)
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error saving braider:', result.error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao salvar cadastro. Verifique os dados e tente novamente.' 
      }, { status: 500 })
    }

    console.log('Braider saved successfully:', result.data)
    
    return NextResponse.json({ 
      success: true, 
      message: existingBraider 
        ? 'Sua nova solicitação foi enviada para aprovação! Nossa equipe irá analisar em breve.'
        : 'Seu cadastro foi enviado para aprovação! Nossa equipe irá analisar em até 48 horas úteis.',
      braider: result.data 
    })
  } catch (error) {
    console.error('💥 Unexpected error adding braider:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
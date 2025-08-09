import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting test data creation...')
    
    const supabase = getServiceClient()

    // 1. Create braider user
    console.log('👤 Creating braider user...')
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Maria Trancas',
        email: 'maria.trancas@teste.com',
        role: 'braider',
        email_verified: true
      }, {
        onConflict: 'email'
      })

    if (userError && userError.code !== '23505') { // Ignore conflict error
      console.error('❌ Error creating braider user:', userError)
      return NextResponse.json({
        success: false,
        error: 'Error creating braider user: ' + userError.message
      }, { status: 500 })
    }

    // 2. First, delete any existing braider (to avoid constraint issues)
    console.log('🗑️ Cleaning existing braider data...')
    await supabase
      .from('services')
      .delete()
      .eq('braider_id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
    
    await supabase
      .from('braiders')
      .delete()
      .eq('id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')

    // Create braider with minimal data first
    console.log('💇‍♀️ Creating braider...')
    const { error: braiderError } = await supabase
      .from('braiders')
      .insert({
        id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        user_id: '11111111-1111-1111-1111-111111111111',
        name: 'Maria Trancas',
        bio: 'Especialista em tranças afro-brasileiras com mais de 10 anos de experiência.',
        location: 'Lisboa, Portugal',
        contact_phone: '+351 912 345 678',
        contact_email: 'maria.trancas@teste.com',
        status: 'approved',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b787?w=400&h=400&fit=crop&crop=face',
        portfolio_images: [
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400',
          'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=600&h=400'
        ],
        district: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Estrela',
        specialties: ['Box Braids', 'Tranças Rastafári', 'Twist', 'Cornrows']
      })

    if (braiderError) {
      console.error('❌ Error creating braider:', braiderError)
      return NextResponse.json({
        success: false,
        error: 'Error creating braider: ' + braiderError.message
      }, { status: 500 })
    }

    // 3. Create client user
    console.log('👤 Creating client user...')
    const { error: clientError } = await supabase
      .from('users')
      .upsert({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Ana Cliente',
        email: 'ana.cliente@teste.com',
        role: 'customer',
        email_verified: true
      }, {
        onConflict: 'email'
      })

    if (clientError && clientError.code !== '23505') {
      console.error('❌ Error creating client user:', clientError)
      return NextResponse.json({
        success: false,
        error: 'Error creating client user: ' + clientError.message
      }, { status: 500 })
    }

    // 4. Create services
    console.log('⚡ Creating services...')
    const services = [
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Box Braids Clássicas',
        description: 'Tranças box braids tradicionais com extensões sintéticas.',
        price: 120.00,
        duration_minutes: 240,
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300'
      },
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Tranças Rastafári',
        description: 'Tranças rastafári autênticas com extensões naturais.',
        price: 150.00,
        duration_minutes: 300,
        image_url: 'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=400&h=300'
      },
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Twist Moderno',
        description: 'Penteado twist moderno e elegante.',
        price: 90.00,
        duration_minutes: 180,
        image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300'
      }
    ]

    for (const service of services) {
      const { error: serviceError } = await supabase
        .from('services')
        .upsert(service, {
          onConflict: 'braider_id,name'
        })

      if (serviceError && serviceError.code !== '23505') {
        console.error(`❌ Error creating service ${service.name}:`, serviceError)
      }
    }

    // 5. Verify created data
    console.log('📊 Verifying created data...')
    
    const { data: braiderData, error: verifyError } = await supabase
      .from('braiders')
      .select(`
        id, 
        user_id, 
        name,
        status, 
        location,
        users!braiders_user_id_fkey(name, email)
      `)
      .eq('id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
      .single()

    if (verifyError) {
      console.error('❌ Error verifying braider:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'Error verifying braider: ' + verifyError.message
      }, { status: 500 })
    }

    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('braider_id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully!',
      data: {
        braider: braiderData,
        services: servicesData,
        servicesCount: servicesData?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
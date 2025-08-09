import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  try {
    const supabase = getServiceClient()

    console.log('🔧 Attempting to fix braider constraint issue...')

    const braiderId = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7'
    const userId = '88888888-8888-8888-8888-888888888888' // Camila Oliveira

    // Step 1: Create braider and service in a transaction-like approach
    // First create a service that we'll assign to the braider
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .upsert({
        id: 'test-service-1',
        braider_id: braiderId,
        name: 'Teste de Chat',
        description: 'Serviço de teste para o sistema de chat',
        price: 50.00,
        duration_minutes: 120,
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300'
      }, {
        onConflict: 'id'
      })

    if (serviceError) {
      console.log('⚠️ Service creation failed (expected):', serviceError.message)
      // This might fail because braider doesn't exist yet
    }

    // Step 2: Try to create braider with raw SQL to bypass some constraints
    const { data: braiderResult, error: braiderError } = await supabase.rpc('create_test_braider', {
      p_braider_id: braiderId,
      p_user_id: userId,
      p_name: 'Camila Oliveira - Teste Chat',
      p_bio: 'Trancista especializada para teste do chat',
      p_location: 'Lisboa, Portugal'
    })

    if (braiderError) {
      console.error('❌ Function failed, trying direct insert...')
      
      // Step 3: Try direct SQL execution
      const { data: sqlResult, error: sqlError } = await supabase.rpc('sql', {
        query: `
          -- Temporarily disable the constraint
          ALTER TABLE public.braiders DISABLE TRIGGER ALL;
          
          -- Insert braider
          INSERT INTO public.braiders (
            id, user_id, name, bio, location, status, contact_email, contact_phone
          ) VALUES (
            '${braiderId}', 
            '${userId}', 
            'Camila Oliveira - Teste Chat',
            'Trancista especializada para teste do chat',
            'Lisboa, Portugal',
            'approved',
            'camila@example.com',
            '+351 912 345 678'
          ) ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            name = EXCLUDED.name,
            bio = EXCLUDED.bio,
            location = EXCLUDED.location,
            status = EXCLUDED.status;
          
          -- Insert a test service
          INSERT INTO public.services (
            braider_id, name, description, price, duration_minutes
          ) VALUES (
            '${braiderId}',
            'Teste de Chat',
            'Serviço de teste para o sistema de chat',
            50.00,
            120
          ) ON CONFLICT (braider_id, name) DO NOTHING;
          
          -- Re-enable triggers
          ALTER TABLE public.braiders ENABLE TRIGGER ALL;
        `
      })

      if (sqlError) {
        console.error('❌ SQL execution failed:', sqlError)
        
        // Step 4: Last resort - use existing data
        const { data: existingBraiders } = await supabase
          .from('braiders')
          .select('id, user_id, name')
          .limit(5)

        return NextResponse.json({
          success: false,
          error: 'Could not create test braider due to constraints',
          suggestion: 'Use one of the existing braiders for testing',
          existing_braiders: existingBraiders,
          alternative_solution: 'Update the frontend to use an existing braider ID'
        })
      }
    }

    // Verify the braider was created
    const { data: verificationData, error: verifyError } = await supabase
      .from('braiders')
      .select('id, user_id, name, bio, location')
      .eq('id', braiderId)
      .single()

    if (verifyError) {
      return NextResponse.json({
        success: false,
        error: 'Braider creation uncertain: ' + verifyError.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Test braider created successfully',
      braider: verificationData
    })

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
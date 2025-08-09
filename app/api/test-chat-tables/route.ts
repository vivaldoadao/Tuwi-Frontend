import { NextRequest, NextResponse } from 'next/server'
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

    // Create a simple braider using an existing user (Camila Oliveira - braider role)
    const braiderId = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7'
    const userId = '88888888-8888-8888-8888-888888888888' // Camila Oliveira

    console.log('🧪 Testing: Creating simple braider for chat...')

    // First, try to insert directly with minimal required fields
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .upsert({
        id: braiderId,
        user_id: userId,
        bio: 'Trancista especializada para teste do chat',
        location: 'Lisboa, Portugal'
      }, {
        onConflict: 'id'
      })
      .select()

    if (braiderError) {
      console.error('❌ Error creating braider:', braiderError)
      return NextResponse.json({
        success: false,
        error: 'Error creating braider: ' + braiderError.message,
        braider_error: braiderError
      }, { status: 500 })
    }

    // Verify the braider was created
    const { data: verificationData, error: verifyError } = await supabase
      .from('braiders')
      .select('id, user_id, bio, location')
      .eq('id', braiderId)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying braider:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'Error verifying braider: ' + verifyError.message
      }, { status: 500 })
    }

    console.log('✅ Braider created successfully:', verificationData)

    return NextResponse.json({
      success: true,
      message: 'Simple braider created for chat testing',
      braider: verificationData,
      instructions: {
        next_step: 'Now you can test the chat by clicking "Iniciar Conversa" on the braider profile',
        braider_id: braiderId,
        user_id: userId
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
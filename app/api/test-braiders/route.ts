import { NextRequest, NextResponse } from 'next/server'
import { getBraiderByUserId } from '@/lib/data-supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('=== TEST BRAIDERS API ===')
    console.log('Session user:', { 
      id: session.user.id, 
      email: session.user.email, 
      role: session.user.role 
    })

    // Try to get braider data
    const braiderData = await getBraiderByUserId(session.user.id)
    
    console.log('Braider data result:', braiderData ? 'Found' : 'Not found')
    
    return NextResponse.json({
      success: true,
      message: 'Test completed',
      userData: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      braiderData: braiderData,
      hasBraiderData: !!braiderData
    })

  } catch (error) {
    console.error('Test braiders API error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro no teste da API' },
      { status: 500 }
    )
  }
}
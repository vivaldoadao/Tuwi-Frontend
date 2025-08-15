import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const userEmail = session.user.email
    
    console.log('🔍 Debug: Checking braider for user:', userEmail)
    
    // 1. Verificar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', userEmail)
      .single()
    
    console.log('👤 User data:', userData, 'Error:', userError)
    
    // 2. Buscar braider por contact_email
    const { data: braiderByEmail, error: emailError } = await supabase
      .from('braiders')
      .select('id, name, contact_email, user_id, status')
      .eq('contact_email', userEmail)
      .single()
    
    console.log('📧 Braider by email:', braiderByEmail, 'Error:', emailError)
    
    // 3. Buscar braider por user_id (se usuário existe)
    let braiderByUserId = null
    let userIdError = null
    
    if (userData?.id) {
      const { data, error } = await supabase
        .from('braiders')
        .select('id, name, contact_email, user_id, status')
        .eq('user_id', userData.id)
        .single()
      
      braiderByUserId = data
      userIdError = error
      console.log('🆔 Braider by user_id:', braiderByUserId, 'Error:', userIdError)
    }
    
    // 4. Listar todos os braiders para debug
    const { data: allBraiders } = await supabase
      .from('braiders')
      .select('id, name, contact_email, user_id, status')
      .limit(10)
    
    console.log('🎯 All braiders (first 10):', allBraiders)

    return NextResponse.json({
      currentUser: {
        email: userEmail,
        id: session.user.id,
        userData: userData
      },
      braiderSearch: {
        byEmail: {
          data: braiderByEmail,
          error: emailError?.message
        },
        byUserId: {
          data: braiderByUserId,
          error: userIdError?.message
        }
      },
      allBraiders: allBraiders,
      debug: {
        foundByEmail: !!braiderByEmail,
        foundByUserId: !!braiderByUserId,
        hasUser: !!userData,
        userRole: userData?.role
      }
    })

  } catch (error) {
    console.error('Error in debug braider check:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
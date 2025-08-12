import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id
    
    console.log('🔍 Fetching user info for ID:', userId)
    
    const serviceSupabase = getServiceClient()
    
    // Get user information
    const { data: user, error: userError } = await serviceSupabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single()
      
    if (userError || !user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ User found:', user.name)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url || `/placeholder.svg?height=40&width=40&text=${user.name?.[0] || 'U'}`,
        isOnline: false, // TODO: Implement online status
        lastSeen: ''     // TODO: Implement last seen
      }
    })
    
  } catch (error) {
    console.error('💥 Error in users API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
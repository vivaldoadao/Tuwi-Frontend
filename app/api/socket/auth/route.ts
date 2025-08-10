import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 WebSocket auth endpoint called')
    console.log('🌍 Environment check:', {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV
    })

    // Get the request body to see if user info is passed
    let body = null
    try {
      body = await request.json()
      console.log('📤 Request body:', body)
    } catch (e) {
      console.log('📭 No request body')
    }

    // Create a simple JWT token for WebSocket authentication
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET não está definido')
    }

    // Get the correct user ID from database by email
    let correctUserId = body?.userId
    let correctUserName = body?.name
    
    if (body?.email) {
      console.log('🔍 Looking up user in database by email:', body.email)
      const { data: userFromDb, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('email', body.email)
        .single()
      
      if (userFromDb && !error) {
        console.log('✅ User found in database:', userFromDb)
        correctUserId = userFromDb.id
        correctUserName = userFromDb.name
        
        if (userFromDb.id !== body?.userId) {
          console.warn(`⚠️ FIXED ID MISMATCH! Client sent ${body?.userId}, database has ${userFromDb.id}`)
        }
      } else {
        console.error('❌ User not found in database:', error)
      }
    }

    // Create token payload with correct user ID
    const authPayload = {
      authenticated: true,
      timestamp: Date.now(),
      iat: Math.floor(Date.now() / 1000),
      userId: correctUserId,
      email: body?.email,
      name: correctUserName
    }

    console.log('🎫 Creating JWT token with payload:', authPayload)

    const token = jwt.sign(
      authPayload,
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '24h' }
    )

    console.log('✅ JWT token created successfully')

    return NextResponse.json({ 
      token,
      message: 'Token created successfully',
      payload: authPayload
    })

  } catch (error) {
    console.error('❌ Error generating WebSocket token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}
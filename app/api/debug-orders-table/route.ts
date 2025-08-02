import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    console.log('🔍 Debug: Checking orders table structure and policies')

    // Get a sample of orders to check the structure
    const { data: sampleOrders, error: sampleError } = await supabase
      .from('orders')
      .select('id, status, customer_email, customer_name, total, created_at, updated_at')
      .limit(5)

    if (sampleError) {
      console.error('❌ Error fetching sample orders:', sampleError)
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar pedidos de exemplo: ${sampleError.message}`,
        details: sampleError
      })
    }

    console.log('✅ Sample orders:', sampleOrders)

    // Try to get the current user info
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error getting user:', userError)
    } else {
      console.log('✅ Current user:', user.user?.id, user.user?.email)
    }

    // Check if we can access the users table to verify admin role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', user.user?.id || '')
      .single()

    if (userDataError) {
      console.error('❌ Error fetching user data:', userDataError)
    } else {
      console.log('✅ User role data:', userData)
    }

    return NextResponse.json({
      success: true,
      sampleOrders,
      ordersCount: sampleOrders?.length || 0,
      currentUser: user.user?.id,
      currentUserEmail: user.user?.email,
      userData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Unexpected error in debug-orders-table:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    )
  }
}
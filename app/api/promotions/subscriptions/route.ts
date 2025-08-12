import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'

/**
 * API para gerenciar assinaturas de promoções
 * 
 * GET /api/promotions/subscriptions - Listar assinaturas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const isAdmin = searchParams.get('admin') === 'true'

    // Para admin, retornar todas as assinaturas
    if (isAdmin && session.user.role === 'admin') {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get() { return undefined },
            set() {},
            remove() {}
          }
        }
      )

      const { data: subscriptions, error } = await supabase
        .from('promotion_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching subscriptions:', error)
        
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          return NextResponse.json({
            success: true,
            subscriptions: [],
            total: 0,
            message: 'Subscriptions table not yet created. Please execute the combos schema first.'
          })
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch subscriptions'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions || [],
        total: (subscriptions || []).length
      })
    }

    // Para usuários normais, retornar apenas suas próprias assinaturas
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from('promotion_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user subscriptions:', error)
      
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          subscriptions: [],
          total: 0,
          message: 'Subscriptions table not yet created. Please execute the combos schema first.'
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch subscriptions'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      total: (subscriptions || []).length
    })

  } catch (error) {
    console.error('Error in GET /api/promotions/subscriptions:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
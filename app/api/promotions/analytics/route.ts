import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    return false
  }
}

// GET /api/promotions/analytics - Obter analytics (próprias ou todas se admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const summary = url.searchParams.get('summary') === 'true'

    if (summary) {
      // Retornar resumo das analytics
      return await getAnalyticsSummary(serviceClient, session.user.id, await isAdmin())
    }

    // Implementar busca detalhada de analytics aqui se necessário
    return NextResponse.json({ 
      message: 'Analytics detailed view not implemented yet' 
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}

// POST /api/promotions/analytics - Registrar evento de analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { promotion_id, event_type, metadata } = body

    if (!promotion_id || !event_type) {
      return NextResponse.json({
        error: 'Missing promotion_id or event_type'
      }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Criar evento de analytics
    const analyticsEvent = {
      promotion_id,
      event_type,
      event_timestamp: new Date().toISOString(),
      metadata: metadata || {}
    }

    const { error: insertError } = await serviceClient
      .from('promotion_analytics')
      .insert(analyticsEvent)

    if (insertError) {
      console.error('Error inserting analytics event:', insertError)
    }

    // Tentar incrementar contador via RPC
    const updateField = event_type === 'view' ? 'views_count' : 
                       event_type === 'click' ? 'clicks_count' :
                       event_type === 'contact' || event_type === 'message' ? 'contacts_count' : null

    if (updateField) {
      const { error: rpcError } = await serviceClient
        .rpc('increment_promotion_counter', {
          promotion_id: promotion_id,
          field_name: updateField
        })
        
      if (rpcError) {
        console.warn('Failed to increment counter via RPC:', rpcError)
      }
    }

    return NextResponse.json({ 
      event: analyticsEvent,
      success: true
    })

  } catch (error) {
    console.error('Error tracking analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track analytics event'
    }, { status: 500 })
  }
}

// Helper function for analytics summary
async function getAnalyticsSummary(serviceClient: any, userId: string, isAdminUser: boolean) {
  try {
    // Basic summary implementation
    let query = serviceClient
      .from('promotions')
      .select('views_count, clicks_count, contacts_count, type, status')
      
    if (!isAdminUser) {
      query = query.eq('user_id', userId)
    }
    
    const { data: promotions } = await query
    
    const summary = {
      total_views: promotions?.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0) || 0,
      total_clicks: promotions?.reduce((sum: number, p: any) => sum + (p.clicks_count || 0), 0) || 0,
      total_contacts: promotions?.reduce((sum: number, p: any) => sum + (p.contacts_count || 0), 0) || 0,
      total_promotions: promotions?.length || 0,
      active_promotions: promotions?.filter((p: any) => p.status === 'active').length || 0
    }
    
    return NextResponse.json({ 
      success: true,
      summary 
    })
    
  } catch (error) {
    console.error('Error getting analytics summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics summary'
    }, { status: 500 })
  }
}
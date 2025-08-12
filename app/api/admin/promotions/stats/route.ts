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

// GET /api/admin/promotions/stats - Estatísticas completas do sistema (admin apenas)
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()

    // Usar a função RPC se disponível, senão fazer queries manuais
    let stats
    
    try {
      const { data: rpcStats, error: rpcError } = await serviceClient
        .rpc('get_promotion_system_stats')

      if (!rpcError && rpcStats) {
        stats = rpcStats
      } else {
        throw new Error('RPC not available, using manual queries')
      }
    } catch (rpcError) {
      // Fallback para queries manuais
      console.log('Using fallback stats calculation')
      
      // Buscar dados básicos
      const [promotionsRes, transactionsRes] = await Promise.all([
        serviceClient
          .from('promotions')
          .select('*'),
        serviceClient
          .from('promotion_transactions')
          .select('amount')
          .eq('status', 'completed')
      ])

      const promotions = promotionsRes.data || []
      const transactions = transactionsRes.data || []

      // Calcular estatísticas manualmente
      const totalPromotions = promotions.length
      const activePromotions = promotions.filter(p => p.status === 'active').length
      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      const totalViews = promotions.reduce((sum, p) => sum + (p.views_count || 0), 0)
      const totalClicks = promotions.reduce((sum, p) => sum + (p.clicks_count || 0), 0)
      
      stats = {
        total_promotions: totalPromotions,
        active_promotions: activePromotions,
        total_revenue: totalRevenue,
        total_views: totalViews,
        total_clicks: totalClicks,
        ctr_percentage: totalViews > 0 ? ((totalClicks / totalViews) * 100) : 0,
        avg_revenue_per_promotion: totalPromotions > 0 ? (totalRevenue / totalPromotions) : 0,
        generated_at: new Date().toISOString()
      }
    }

    // Buscar dados adicionais para dashboard
    const [
      pendingPromotions,
      expiringPromotions,
      recentPromotions,
      topPerformers
    ] = await Promise.all([
      // Promoções pendentes de aprovação
      serviceClient
        .from('promotions')
        .select('id, title, type, user:auth.users!inner(email, raw_user_meta_data)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Promoções expirando em breve
      serviceClient
        .from('promotions')
        .select('id, title, type, end_date, user:auth.users!inner(email, raw_user_meta_data)')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .lte('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('end_date', { ascending: true })
        .limit(10),
      
      // Promoções recentes
      serviceClient
        .from('promotions')
        .select('id, title, type, status, created_at, user:auth.users!inner(email, raw_user_meta_data)')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Top performers
      serviceClient
        .from('promotions')
        .select('id, title, type, views_count, clicks_count, contacts_count, user:auth.users!inner(email, raw_user_meta_data)')
        .gt('views_count', 0)
        .order('views_count', { ascending: false })
        .limit(10)
    ])

    // Estatísticas por tipo de promoção
    const { data: promotionsByType } = await serviceClient
      .from('promotions')
      .select('type, status')

    const typeStats = (promotionsByType || []).reduce((acc: any, p) => {
      if (!acc[p.type]) {
        acc[p.type] = { total: 0, active: 0, pending: 0, expired: 0 }
      }
      acc[p.type].total++
      acc[p.type][p.status] = (acc[p.type][p.status] || 0) + 1
      return acc
    }, {})

    // Estatísticas de crescimento (últimos 30 dias vs anteriores)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const [recentStats, previousStats] = await Promise.all([
      serviceClient
        .from('promotions')
        .select('id')
        .gte('created_at', thirtyDaysAgo),
      serviceClient
        .from('promotions')
        .select('id')
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo)
    ])

    const recentCount = recentStats.data?.length || 0
    const previousCount = previousStats.data?.length || 0
    const growthPercentage = previousCount > 0 ? 
      ((recentCount - previousCount) / previousCount * 100) : 
      (recentCount > 0 ? 100 : 0)

    return NextResponse.json({
      stats,
      pending_promotions: pendingPromotions.data || [],
      expiring_promotions: expiringPromotions.data || [],
      recent_promotions: recentPromotions.data || [],
      top_performers: topPerformers.data || [],
      stats_by_type: typeStats,
      growth: {
        recent_count: recentCount,
        previous_count: previousCount,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/promotions/stats/cleanup - Limpeza de dados antigos
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const body = await request.json()
    const { action, retention_days = 90 } = body

    if (action === 'cleanup_analytics') {
      try {
        const { data: cleanupResult } = await serviceClient
          .rpc('cleanup_old_analytics', { retention_days })

        return NextResponse.json({
          message: 'Analytics cleanup completed',
          deleted_records: cleanupResult || 0
        })
      } catch (rpcError) {
        // Fallback manual cleanup
        const cutoffDate = new Date(Date.now() - retention_days * 24 * 60 * 60 * 1000).toISOString()
        
        const { error } = await serviceClient
          .from('promotion_analytics')
          .delete()
          .lt('created_at', cutoffDate)

        if (error) throw error

        return NextResponse.json({
          message: 'Analytics cleanup completed (manual)',
          retention_days
        })
      }
    }

    if (action === 'expire_promotions') {
      try {
        const { data: expireResult } = await serviceClient
          .rpc('expire_promotions')

        return NextResponse.json({
          message: 'Promotions expired successfully',
          expired_count: expireResult?.expired_count || 0,
          expired_ids: expireResult?.expired_ids || []
        })
      } catch (rpcError) {
        // Fallback manual expire
        const { data: expiredPromotions, error } = await serviceClient
          .from('promotions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('status', 'active')
          .lt('end_date', new Date().toISOString())
          .select('id')

        if (error) throw error

        return NextResponse.json({
          message: 'Promotions expired successfully (manual)',
          expired_count: expiredPromotions?.length || 0,
          expired_ids: expiredPromotions?.map(p => p.id) || []
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in admin stats action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
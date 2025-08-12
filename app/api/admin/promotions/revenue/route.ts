import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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

    // Calcular datas para períodos
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const startOfMonth = new Date(startOfToday)
    startOfMonth.setDate(startOfMonth.getDate() - 30)
    const startOfLastMonth = new Date(startOfMonth)
    startOfLastMonth.setDate(startOfLastMonth.getDate() - 30)

    // 1. Receita total de todas as transações pagas
    const { data: totalRevenueData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = totalRevenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const totalTransactions = totalRevenueData?.length || 0

    // 2. Receita mensal (últimos 30 dias)
    const { data: monthlyData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString())

    const monthlyRevenue = monthlyData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // 3. Receita do mês anterior para comparação
    const { data: lastMonthData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())

    const lastMonthRevenue = lastMonthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // 4. Receita semanal (últimos 7 dias)
    const { data: weeklyData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfWeek.toISOString())

    const weeklyRevenue = weeklyData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // 5. Receita diária (hoje)
    const { data: dailyData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfToday.toISOString())

    const dailyRevenue = dailyData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // 6. Promoções ativas
    const { data: activePromotions } = await supabase
      .from('promotions')
      .select('id')
      .eq('status', 'active')

    const activePromotionsCount = activePromotions?.length || 0

    // 7. Calcular crescimento mensal
    const monthlyGrowthPercentage = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : monthlyRevenue > 0 ? '100.0' : '0.0'
    
    const isGrowthPositive = Number(monthlyGrowthPercentage) >= 0

    // 8. Pacote mais popular por receita
    const { data: packagePopularityData } = await supabase
      .from('promotion_transactions')
      .select(`
        promotion_id,
        amount,
        promotions (
          type
        )
      `)
      .eq('status', 'completed')

    const packageStats: { [key: string]: { revenue: number; count: number } } = {}
    
    packagePopularityData?.forEach(transaction => {
      const type = (transaction as any).promotions?.type || 'unknown'
      if (!packageStats[type]) {
        packageStats[type] = { revenue: 0, count: 0 }
      }
      packageStats[type].revenue += Number(transaction.amount)
      packageStats[type].count += 1
    })

    const topPackageType = Object.entries(packageStats)
      .sort(([,a], [,b]) => b.revenue - a.revenue)[0] || ['profile_highlight', { revenue: 0, count: 0 }]

    // 9. Transações recentes com dados do usuário
    const { data: recentTransactions } = await supabase
      .from('promotion_transactions')
      .select(`
        created_at,
        amount,
        promotions (
          type,
          user_id
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar nomes dos usuários para as transações recentes
    const userIds = recentTransactions?.map(t => (t as any).promotions?.user_id).filter(Boolean) || []
    const { data: users } = await supabase.auth.admin.listUsers()
    
    const userMap = new Map()
    users.users.forEach(user => {
      userMap.set(user.id, user.user_metadata?.name || user.email || 'Usuário')
    })

    const formattedRecentTransactions = recentTransactions?.map(transaction => ({
      date: transaction.created_at,
      amount: Number(transaction.amount),
      type: (transaction as any).promotions?.type || 'unknown',
      user_name: userMap.get((transaction as any).promotions?.user_id) || 'Usuário'
    })) || []

    // Calcular crescimento semanal (comparando com semana anterior)
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const { data: lastWeekData } = await supabase
      .from('promotion_transactions')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfLastWeek.toISOString())
      .lt('created_at', startOfWeek.toISOString())

    const lastWeekRevenue = lastWeekData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const weeklyGrowthPercentage = lastWeekRevenue > 0 
      ? Number(((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1))
      : weeklyRevenue > 0 ? 100 : 0

    const response = {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      weekly_revenue: weeklyRevenue,
      daily_revenue: dailyRevenue,
      total_transactions: totalTransactions,
      active_promotions: activePromotionsCount,
      revenue_growth: {
        monthly_percentage: Number(monthlyGrowthPercentage),
        weekly_percentage: weeklyGrowthPercentage,
        is_positive: isGrowthPositive
      },
      top_package_type: {
        type: topPackageType[0],
        revenue: topPackageType[1].revenue,
        count: topPackageType[1].count
      },
      recent_transactions: formattedRecentTransactions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching revenue data:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch revenue data',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    )
  }
}
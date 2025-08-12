import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const serviceClient = getServiceClient()

    // Verificar se o usuário é admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 1. Buscar configurações da plataforma usando service client
    const { data: settings } = await serviceClient
      .from('platform_settings')
      .select('key, value')
      .in('key', ['commission_rate', 'monetization_enabled'])

    const commissionRate = settings?.find(s => s.key === 'commission_rate')?.value || 0.10
    const monetizationEnabled = settings?.find(s => s.key === 'monetization_enabled')?.value || false

    // 2. Buscar todas as trancistas aprovadas com dados de comissão usando service client
    const { data: braiders, error: braidersError } = await serviceClient
      .from('braiders')
      .select(`
        id,
        name,
        contact_email,
        profile_image_url,
        status,
        created_at
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (braidersError) {
      console.error('Error fetching braiders:', braidersError)
      return NextResponse.json({ error: 'Failed to fetch braiders' }, { status: 500 })
    }

    // 3. Buscar transações para cada trancista
    const { data: allTransactions, error: transactionsError } = await supabase
      .from('platform_transactions')
      .select('*')
      .in('braider_id', braiders?.map(b => b.id) || [])

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // 4. Calcular métricas para cada trancista
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const braidersWithCommissions = braiders?.map(braider => {
      const braiderTransactions = allTransactions?.filter(t => t.braider_id === braider.id) || []
      
      // Transações do mês atual
      const currentMonthTransactions = braiderTransactions.filter(t => {
        const transactionDate = new Date(t.created_at)
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear
      })

      // Cálculos gerais
      const totalBookings = braiderTransactions.length
      const completedBookings = braiderTransactions.filter(t => t.status === 'completed').length
      const totalRevenue = braiderTransactions.reduce((sum, t) => sum + (t.service_amount || 0), 0)
      const totalCommissions = braiderTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
      
      // Cálculos do mês atual
      const currentMonthRevenue = currentMonthTransactions.reduce((sum, t) => sum + (t.service_amount || 0), 0)
      const currentMonthCommissions = currentMonthTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
      
      // Último pagamento
      const completedTransactions = braiderTransactions
        .filter(t => t.status === 'completed' && t.processed_at)
        .sort((a, b) => new Date(b.processed_at!).getTime() - new Date(a.processed_at!).getTime())
      
      const lastPayment = completedTransactions.length > 0 
        ? completedTransactions[0].processed_at!.split('T')[0]
        : undefined

      return {
        id: braider.id,
        name: braider.name,
        email: braider.contact_email || '',
        profileImage: braider.profile_image_url,
        totalBookings,
        completedBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        lastPayment,
        status: braider.status === 'approved' ? 'active' as const : 'pending' as const,
        joinedAt: braider.created_at.split('T')[0],
        currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
        currentMonthCommissions: Math.round(currentMonthCommissions * 100) / 100
      }
    }) || []

    // 5. Calcular estatísticas gerais
    const totalCommissions = braidersWithCommissions.reduce((sum, b) => sum + b.totalCommissions, 0)
    const monthlyCommissions = braidersWithCommissions.reduce((sum, b) => sum + b.currentMonthCommissions, 0)
    const totalBraiders = braidersWithCommissions.length
    const activeBraiders = braidersWithCommissions.filter(b => b.status === 'active').length
    const pendingPayments = braidersWithCommissions.filter(b => !b.lastPayment && b.totalCommissions > 0).length
    const averageCommission = totalBraiders > 0 ? totalCommissions / totalBraiders : 0

    const stats = {
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      monthlyCommissions: Math.round(monthlyCommissions * 100) / 100,
      totalBraiders,
      activeBraiders,
      pendingPayments,
      averageCommission: Math.round(averageCommission * 100) / 100,
      commissionRate: parseFloat(commissionRate),
      monetizationEnabled
    }

    return NextResponse.json({
      stats,
      braiders: braidersWithCommissions
    })

  } catch (error) {
    console.error('Error in admin commissions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Para processar pagamentos em lote ou ações administrativas
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verificar se o usuário é admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, braiderIds, transactionIds } = body

    if (action === 'process_payments') {
      // Processar pagamentos para trancistas específicas
      const { error } = await supabase
        .from('platform_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('braider_id', braiderIds || [])
        .in('id', transactionIds || [])
        .eq('status', 'pending')

      if (error) {
        console.error('Error processing payments:', error)
        return NextResponse.json({ error: 'Failed to process payments' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: `Pagamentos processados para ${braiderIds?.length || 0} trancista(s)` 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in admin commissions POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
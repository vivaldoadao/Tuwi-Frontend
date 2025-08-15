import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS quando necessário
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎯 === EARNINGS API CALLED ===')
    const session = await auth()
    console.log('🔐 Session:', { 
      hasSession: !!session, 
      userId: session?.user?.id, 
      userEmail: session?.user?.email 
    })
    
    if (!session?.user?.id) {
      console.error('❌ No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: braiderId } = await params
    console.log('🆔 Braider ID from params:', braiderId)
    
    const supabase = await createClient()
    const serviceClient = getServiceClient()

    // Verificar se o usuário tem permissão usando service client (contorna RLS)
    console.log('👤 Fetching user data for:', session.user.id, 'email:', session.user.email)
    let { data: user, error: userError } = await serviceClient
      .from('users')
      .select('role, email')
      .eq('id', session.user.id)
      .single()

    console.log('👤 User data:', user, 'Error:', userError)
    
    if (userError) {
      console.error('❌ User not found in database, trying by email...')
      
      // Se falhar buscar por ID, tentar por email
      const { data: userByEmail, error: emailError } = await serviceClient
        .from('users')
        .select('role, email, id')
        .eq('email', session.user.email)
        .single()
      
      console.log('👤 User by email:', userByEmail, 'Error:', emailError)
      
      if (emailError) {
        console.error('❌ User not found by email either')
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      // Usar dados encontrados por email
      user = userByEmail
    }

    // Buscar braider usando service client para contornar RLS
    console.log('🔍 Looking for braider with ID:', braiderId)
    let { data: braider, error: braiderError } = await serviceClient
      .from('braiders')
      .select('id, user_id, name, contact_email')
      .eq('id', braiderId)
      .single()

    console.log('🔍 Braider lookup result:', { braider, braiderError })

    if (braiderError) {
      console.error('❌ Braider lookup error:', braiderError)
      
      // Se não encontrar por ID, tentar encontrar por user_id
      console.log('🔄 Trying to find braider by user_id:', braiderId)
      const { data: braiderByUserId, error: braiderByUserError } = await serviceClient
        .from('braiders')
        .select('id, user_id, name, contact_email')
        .eq('user_id', braiderId)
        .single()
      
      console.log('🔍 Braider by user_id result:', { braiderByUserId, braiderByUserError })
      
      if (braiderByUserError) {
        // Se não encontrar braider, retornar dados zerados em vez de erro
        console.log(`❌ No braider found for user ${braiderId}, returning default earnings data`)
        
        return NextResponse.json({
          totalEarnings: 0,
          monthlyEarnings: 0,
          pendingCommissions: 0,
          platformCommission: 0,
          netEarnings: 0,
          lastPayment: null,
          monthlyComparison: 0,
          servicesCompleted: 0,
          averageServiceValue: 0,
          commissionRate: 0.10,
          monetizationEnabled: false,
          transactions: [],
          message: 'User is not registered as a braider yet'
        })
      }
      
      // Usar os dados encontrados por user_id
      braider = braiderByUserId
      console.log('✅ Found braider by user_id:', braider)
    } else {
      console.log('✅ Found braider by ID:', braider)
    }

    if (!braider) {
      // Se ainda não encontrar braider, retornar dados zerados
      return NextResponse.json({
        totalEarnings: 0,
        monthlyEarnings: 0,
        pendingCommissions: 0,
        platformCommission: 0,
        netEarnings: 0,
        lastPayment: null,
        monthlyComparison: 0,
        servicesCompleted: 0,
        averageServiceValue: 0,
        commissionRate: 0.10,
        monetizationEnabled: false,
        transactions: [],
        message: 'User is not registered as a braider yet'
      })
    }

    // Verificar permissões - permitir se é admin ou se é a própria trancista (usando email como padrão do sistema)
    const userEmail = session.user.email
    if (user.role !== 'admin' && braider.contact_email !== userEmail) {
      console.log('Permission denied for earnings access:', { 
        userRole: user.role, 
        braiderEmail: braider.contact_email, 
        userEmail,
        braiderId: braider.id
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('Permission granted for earnings access:', { 
      userRole: user.role, 
      braiderEmail: braider.contact_email, 
      userEmail,
      isAdmin: user.role === 'admin',
      isOwnBraider: braider.contact_email === userEmail
    })

    // 1. Buscar configurações da plataforma usando service client
    const { data: settings } = await serviceClient
      .from('platform_settings')
      .select('key, value')
      .in('key', ['commission_rate', 'monetization_enabled'])

    const commissionRate = settings?.find(s => s.key === 'commission_rate')?.value || 0.10
    const monetizationEnabled = settings?.find(s => s.key === 'monetization_enabled')?.value || false

    // 2. Buscar transações da trancista usando service client
    let { data: transactions, error: transactionsError } = await serviceClient
      .from('platform_transactions')
      .select('*')
      .eq('braider_id', braider.id) // Usar o ID correto do braider encontrado
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      // Não falhar se não houver transações, apenas usar array vazio
      transactions = []
    }

    // Se não há transações, usar dados padrão
    if (!transactions || transactions.length === 0) {
      console.log(`No transactions found for braider ${braider.id}, returning default data`)
      transactions = []
    }

    // 3. Calcular métricas
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Transações do mês atual
    const currentMonthTransactions = transactions?.filter(t => {
      const transactionDate = new Date(t.created_at)
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear
    }) || []

    // Transações do mês anterior para comparação
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const lastMonthTransactions = transactions?.filter(t => {
      const transactionDate = new Date(t.created_at)
      return transactionDate.getMonth() === lastMonth && 
             transactionDate.getFullYear() === lastMonthYear
    }) || []

    // Cálculos
    const totalEarnings = transactions?.reduce((sum, t) => sum + (t.braider_payout || 0), 0) || 0
    const monthlyEarnings = currentMonthTransactions.reduce((sum, t) => sum + (t.service_amount || 0), 0)
    const monthlyCommissions = currentMonthTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
    const netEarnings = monthlyEarnings - monthlyCommissions
    
    const lastMonthEarnings = lastMonthTransactions.reduce((sum, t) => sum + (t.braider_payout || 0), 0)
    const monthlyComparison = lastMonthEarnings > 0 
      ? ((netEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0

    const servicesCompleted = currentMonthTransactions.filter(t => t.status === 'completed').length
    const averageServiceValue = servicesCompleted > 0 ? monthlyEarnings / servicesCompleted : 0

    // Comissões pendentes
    const pendingCommissions = transactions
      ?.filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.braider_payout || 0), 0) || 0

    // Último pagamento
    const completedTransactions = transactions?.filter(t => t.status === 'completed' && t.processed_at) || []
    const lastPayment = completedTransactions.length > 0 ? {
      amount: completedTransactions[0].braider_payout || 0,
      date: completedTransactions[0].processed_at,
      status: 'completed' as const
    } : null

    // 4. Métricas calculadas (sem necessidade de buscar bookings adicionais por agora)

    const earningsData = {
      totalEarnings,
      monthlyEarnings,
      pendingCommissions,
      platformCommission: monthlyCommissions,
      netEarnings,
      lastPayment,
      monthlyComparison,
      servicesCompleted,
      averageServiceValue,
      commissionRate: parseFloat(commissionRate),
      monetizationEnabled,
      transactions: currentMonthTransactions.map(t => ({
        id: t.id,
        date: t.booking?.date || t.created_at,
        customerName: t.booking?.customer_name || 'Cliente',
        serviceName: `Serviço - €${t.service_amount}`,
        serviceAmount: t.service_amount,
        commissionRate: t.commission_rate,
        commissionAmount: t.commission_amount,
        netEarnings: t.braider_payout,
        status: t.status,
        paymentDate: t.processed_at
      }))
    }

    return NextResponse.json(earningsData)

  } catch (error) {
    console.error('Error in braider earnings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
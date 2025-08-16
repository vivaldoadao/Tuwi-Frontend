/**
 * SISTEMA DE GANHOS E COMISSÕES DAS TRANCISTAS
 * 
 * Funções para calcular e gerenciar ganhos das trancistas
 */

import { createClient } from '@/lib/supabase/server'

export interface BraiderTransaction {
  id: string
  braider_id: string
  booking_id?: string
  service_amount: number
  commission_rate: number
  commission_amount: number
  braider_payout: number
  status: 'simulated' | 'pending' | 'completed' | 'failed'
  is_simulated: boolean
  stripe_payment_intent_id?: string
  stripe_transfer_id?: string
  processed_at?: string
  created_at: string
  updated_at: string
}

export interface BraiderEarningsSummary {
  totalEarnings: number
  monthlyEarnings: number
  pendingCommissions: number
  platformCommission: number
  netEarnings: number
  lastPayment: {
    amount: number
    date: string
    status: 'completed' | 'pending' | 'processing'
  } | null
  monthlyComparison: number
  servicesCompleted: number
  averageServiceValue: number
  commissionRate: number
  transactions: BraiderTransaction[]
}

/**
 * Obter configurações de comissão da plataforma
 */
export async function getPlatformCommissionSettings() {
  const supabase = await createClient()
  
  const { data: settings, error } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['commission_rate', 'monetization_enabled', 'grace_period_days'])
  
  if (error) {
    console.error('Error fetching platform settings:', error)
    return {
      commissionRate: 0.10, // 10% default
      monetizationEnabled: false,
      gracePeriodDays: 30
    }
  }
  
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, any>)
  
  return {
    commissionRate: parseFloat(settingsMap.commission_rate) || 0.10,
    monetizationEnabled: settingsMap.monetization_enabled === true,
    gracePeriodDays: parseInt(settingsMap.grace_period_days) || 30
  }
}

/**
 * Calcular comissão para um serviço
 */
export function calculateCommission(serviceAmount: number, commissionRate: number = 0.10) {
  const commissionAmount = serviceAmount * commissionRate
  const braiderPayout = serviceAmount - commissionAmount
  
  return {
    serviceAmount,
    commissionRate,
    commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
    braiderPayout: Math.round(braiderPayout * 100) / 100
  }
}

/**
 * Registrar uma transação de comissão
 */
export async function recordCommissionTransaction(
  braiderId: string,
  bookingId: string,
  serviceAmount: number,
  isSimulated: boolean = true
) {
  const supabase = await createClient()
  const settings = await getPlatformCommissionSettings()
  const commission = calculateCommission(serviceAmount, settings.commissionRate)
  
  const transactionData = {
    braider_id: braiderId,
    booking_id: bookingId,
    service_amount: commission.serviceAmount,
    commission_rate: commission.commissionRate,
    commission_amount: commission.commissionAmount,
    braider_payout: commission.braiderPayout,
    status: isSimulated ? 'simulated' : 'pending',
    is_simulated: isSimulated
  }
  
  const { data, error } = await supabase
    .from('platform_transactions')
    .insert(transactionData)
    .select()
    .single()
  
  if (error) {
    console.error('Error recording commission transaction:', error)
    throw error
  }
  
  return data
}

/**
 * Obter métricas de ganhos de uma trancista
 */
export async function getBraiderEarnings(braiderId: string): Promise<BraiderEarningsSummary> {
  const supabase = await createClient()
  
  // 1. Buscar transações
  const { data: transactions, error: transactionsError } = await supabase
    .from('platform_transactions')
    .select('*')
    .eq('braider_id', braiderId)
    .order('created_at', { ascending: false })
  
  if (transactionsError) {
    throw transactionsError
  }
  
  // 2. Buscar configurações
  const settings = await getPlatformCommissionSettings()
  
  // 3. Calcular métricas
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.created_at)
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear
  })
  
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const lastMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.created_at)
    return transactionDate.getMonth() === lastMonth && 
           transactionDate.getFullYear() === lastMonthYear
  })
  
  // Cálculos
  const totalEarnings = transactions.reduce((sum, t) => sum + t.braider_payout, 0)
  const monthlyEarnings = currentMonthTransactions.reduce((sum, t) => sum + t.service_amount, 0)
  const monthlyCommissions = currentMonthTransactions.reduce((sum, t) => sum + t.commission_amount, 0)
  const netEarnings = monthlyEarnings - monthlyCommissions
  
  const lastMonthNetEarnings = lastMonthTransactions.reduce((sum, t) => sum + t.braider_payout, 0)
  const monthlyComparison = lastMonthNetEarnings > 0 
    ? ((netEarnings - lastMonthNetEarnings) / lastMonthNetEarnings) * 100 
    : 0
  
  const servicesCompleted = currentMonthTransactions.filter(t => t.status === 'completed').length
  const averageServiceValue = servicesCompleted > 0 ? monthlyEarnings / servicesCompleted : 0
  
  const pendingCommissions = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.braider_payout, 0)
  
  // Último pagamento
  const completedTransactions = transactions.filter(t => t.status === 'completed' && t.processed_at)
  const lastPayment = completedTransactions.length > 0 ? {
    amount: completedTransactions[0].braider_payout,
    date: completedTransactions[0].processed_at!,
    status: 'completed' as const
  } : null
  
  return {
    totalEarnings,
    monthlyEarnings,
    pendingCommissions,
    platformCommission: monthlyCommissions,
    netEarnings,
    lastPayment,
    monthlyComparison,
    servicesCompleted,
    averageServiceValue,
    commissionRate: settings.commissionRate,
    transactions: currentMonthTransactions
  }
}

/**
 * Atualizar métricas mensais da trancista
 */
export async function updateBraiderMetrics(braiderId: string, month: string) {
  const supabase = await createClient()
  
  // Buscar transações do mês
  const startOfMonth = `${month}-01`
  const endOfMonth = new Date(month + '-01')
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  
  const { data: transactions } = await supabase
    .from('platform_transactions')
    .select('*')
    .eq('braider_id', braiderId)
    .gte('created_at', startOfMonth)
    .lt('created_at', endOfMonth.toISOString().split('T')[0])
  
  if (!transactions || transactions.length === 0) {
    return
  }
  
  // Calcular métricas
  const totalRevenue = transactions.reduce((sum, t) => sum + t.service_amount, 0)
  const potentialCommission = transactions.reduce((sum, t) => sum + t.commission_amount, 0)
  const completedBookings = transactions.filter(t => t.status === 'completed').length
  const totalBookings = transactions.length
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
  
  // Inserir/atualizar métricas
  const metricsData = {
    braider_id: braiderId,
    month_year: startOfMonth,
    total_bookings: totalBookings,
    completed_bookings: completedBookings,
    cancelled_bookings: transactions.filter(t => t.status === 'failed').length,
    total_revenue: totalRevenue,
    potential_commission: potentialCommission,
    average_booking_value: averageBookingValue,
    profile_views: 0, // TODO: Implementar tracking de views
    contact_attempts: 0, // TODO: Implementar tracking de contatos
    conversion_rate: 0 // TODO: Calcular baseado em views vs bookings
  }
  
  const { error } = await supabase
    .from('braider_metrics')
    .upsert(metricsData, {
      onConflict: 'braider_id,month_year'
    })
  
  if (error) {
    console.error('Error updating braider metrics:', error)
    throw error
  }
}

/**
 * Processar pagamento de comissões para uma trancista
 */
export async function processBraiderPayment(braiderId: string, transactionIds: string[]) {
  const supabase = await createClient()
  
  // Atualizar transações como processadas
  const { error } = await supabase
    .from('platform_transactions')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      // TODO: Adicionar stripe_transfer_id quando integrar com Stripe
    })
    .in('id', transactionIds)
    .eq('braider_id', braiderId)
  
  if (error) {
    console.error('Error processing braider payment:', error)
    throw error
  }
  
  return true
}
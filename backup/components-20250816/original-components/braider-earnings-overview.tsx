"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp,
  Euro,
  Calendar,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard
} from "lucide-react"
import { useAnalyticsTracker } from "@/lib/analytics-tracker"
import { useMonetization } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

interface EarningsData {
  thisMonth: {
    totalRevenue: number
    commissionPaid: number
    netEarnings: number
    bookingsCompleted: number
  }
  lastMonth: {
    totalRevenue: number
    commissionPaid: number
    netEarnings: number
    bookingsCompleted: number
  }
  last6Months: Array<{
    month: string
    totalRevenue: number
    commissionPaid: number
    netEarnings: number
    bookingsCompleted: number
  }>
}

interface BraiderEarningsOverviewProps {
  braiderId: string
  className?: string
}

export function BraiderEarningsOverview({ braiderId, className }: BraiderEarningsOverviewProps) {
  const { getBraiderMetrics, getBraiderMetricsHistory } = useAnalyticsTracker()
  const { isEnabled: monetizationEnabled, commissionRate } = useMonetization()

  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEarningsData()
  }, [braiderId])

  const loadEarningsData = async () => {
    try {
      // Get current month
      const currentMetrics = await getBraiderMetrics(braiderId)
      
      // Get last 6 months history
      const history = await getBraiderMetricsHistory(braiderId, 6)
      
      // Process data
      const thisMonth = {
        totalRevenue: currentMetrics?.totalRevenue || 0,
        commissionPaid: currentMetrics?.potentialCommission || 0,
        netEarnings: (currentMetrics?.totalRevenue || 0) - (currentMetrics?.potentialCommission || 0),
        bookingsCompleted: currentMetrics?.completedBookings || 0
      }

      // Get last month data
      const lastMonthData = history.length > 1 ? history[1] : null
      const lastMonth = {
        totalRevenue: lastMonthData?.totalRevenue || 0,
        commissionPaid: lastMonthData?.potentialCommission || 0,
        netEarnings: (lastMonthData?.totalRevenue || 0) - (lastMonthData?.potentialCommission || 0),
        bookingsCompleted: lastMonthData?.completedBookings || 0
      }

      // Process 6 months data
      const last6Months = history.map((item, index) => ({
        month: getMonthName(index),
        totalRevenue: item.totalRevenue,
        commissionPaid: item.potentialCommission,
        netEarnings: item.totalRevenue - item.potentialCommission,
        bookingsCompleted: item.completedBookings
      }))

      setEarnings({
        thisMonth,
        lastMonth,
        last6Months
      })

    } catch (error) {
      console.error('Error loading earnings data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (monthsAgo: number): string => {
    const date = new Date()
    date.setMonth(date.getMonth() - monthsAgo)
    return date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
  }

  const calculateGrowth = (current: number, previous: number): { percentage: number, trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' }
    }
    
    const percentage = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(percentage),
      trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!earnings) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Não foi possível carregar os dados de ganhos.</p>
        </CardContent>
      </Card>
    )
  }

  const revenueGrowth = calculateGrowth(earnings.thisMonth.totalRevenue, earnings.lastMonth.totalRevenue)
  const netEarningsGrowth = calculateGrowth(earnings.thisMonth.netEarnings, earnings.lastMonth.netEarnings)

  return (
    <div className={cn("space-y-6", className)}>
      
      {/* Header */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              Seus Ganhos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={monetizationEnabled ? "default" : "secondary"}
                className={cn(
                  monetizationEnabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                )}
              >
                {monetizationEnabled ? `Comissão ${(commissionRate * 100).toFixed(1)}%` : "Período Gratuito"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{earnings.thisMonth.totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {revenueGrowth.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : revenueGrowth.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={cn("text-xs", {
                    "text-green-600": revenueGrowth.trend === 'up',
                    "text-red-600": revenueGrowth.trend === 'down',
                    "text-gray-500": revenueGrowth.trend === 'neutral'
                  })}>
                    {revenueGrowth.percentage.toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {monetizationEnabled ? "Comissão Paga" : "Comissão (Simulada)"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  €{earnings.thisMonth.commissionPaid.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((earnings.thisMonth.commissionPaid / Math.max(earnings.thisMonth.totalRevenue, 1)) * 100).toFixed(1)}% da receita
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ganhos Líquidos</p>
                <p className="text-2xl font-bold text-green-600">
                  €{earnings.thisMonth.netEarnings.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {netEarningsGrowth.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : netEarningsGrowth.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={cn("text-xs", {
                    "text-green-600": netEarningsGrowth.trend === 'up',
                    "text-red-600": netEarningsGrowth.trend === 'down',
                    "text-gray-500": netEarningsGrowth.trend === 'neutral'
                  })}>
                    {netEarningsGrowth.percentage.toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {earnings.thisMonth.bookingsCompleted}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Média: €{earnings.thisMonth.bookingsCompleted > 0 
                    ? (earnings.thisMonth.totalRevenue / earnings.thisMonth.bookingsCompleted).toFixed(2)
                    : '0.00'} por agendamento
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Historical Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900">Histórico de Ganhos (6 Meses)</CardTitle>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          
          {earnings.last6Months.length > 0 ? (
            <div className="space-y-4">
              
              {/* Chart visualization could go here */}
              <div className="grid grid-cols-1 gap-3">
                {earnings.last6Months.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900 min-w-[3rem]">
                        {month.month}
                      </div>
                      <div className="text-sm text-gray-600">
                        {month.bookingsCompleted} agendamentos
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Receita:</span>
                        <span className="ml-1 font-medium text-gray-900">€{month.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Comissão:</span>
                        <span className="ml-1 font-medium text-red-600">-€{month.commissionPaid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Líquido:</span>
                        <span className="ml-1 font-bold text-green-600">€{month.netEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Resumo dos Últimos 6 Meses</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-lg font-bold text-blue-600">
                      €{earnings.last6Months.reduce((sum, month) => sum + month.totalRevenue, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Comissões</p>
                    <p className="text-lg font-bold text-red-600">
                      €{earnings.last6Months.reduce((sum, month) => sum + month.commissionPaid, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ganhos Líquidos</p>
                    <p className="text-lg font-bold text-green-600">
                      €{earnings.last6Months.reduce((sum, month) => sum + month.netEarnings, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum dado histórico disponível ainda.</p>
              <p className="text-sm text-gray-500">Complete alguns agendamentos para ver seu histórico de ganhos.</p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Info about monetization */}
      {!monetizationEnabled && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Período Gratuito</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Atualmente você está no período gratuito. As comissões mostradas são simuladas 
                  para que você possa ver como funcionará o sistema quando for ativado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
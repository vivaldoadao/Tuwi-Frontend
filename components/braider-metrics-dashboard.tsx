"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Euro, 
  Calendar, 
  Eye,
  MessageCircle,
  Star,
  Users,
  BarChart3,
  Info,
  DollarSign,
  Clock
} from "lucide-react"
import { useAnalyticsTracker } from "@/lib/analytics-tracker"
import { useMonetization } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

interface BraiderMetricsDashboardProps {
  braiderId: string
  className?: string
}

export function BraiderMetricsDashboard({ 
  braiderId, 
  className 
}: BraiderMetricsDashboardProps) {
  const { 
    getBraiderMetrics, 
    getBraiderMetricsHistory,
    isMonetizationEnabled 
  } = useAnalyticsTracker()
  
  const { 
    isEnabled: monetizationEnabled,
    showDashboard,
    showPreview,
    commissionRate,
    gracePeriodDays
  } = useMonetization()

  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [historicalMetrics, setHistoricalMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMonetizationActive, setIsMonetizationActive] = useState(false)

  // Load metrics on mount
  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true)
        
        // Load current month metrics
        const current = await getBraiderMetrics(braiderId)
        setCurrentMetrics(current)

        // Load historical data (last 6 months)
        const history = await getBraiderMetricsHistory(braiderId, 6)
        setHistoricalMetrics(history)

        // Check monetization status
        const monetizationStatus = await isMonetizationEnabled()
        setIsMonetizationActive(monetizationStatus)

      } catch (error) {
        console.error('Error loading braider metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [braiderId, getBraiderMetrics, getBraiderMetricsHistory, isMonetizationEnabled])

  // Don't show dashboard if feature flag is disabled
  if (!showDashboard) return null

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

  const metrics = currentMetrics || {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    potentialCommission: 0,
    averageBookingValue: 0
  }

  const conversionRate = metrics.totalBookings > 0 
    ? (metrics.completedBookings / metrics.totalBookings) * 100 
    : 0

  const totalHistoricalRevenue = historicalMetrics.reduce(
    (sum, month) => sum + (month.totalRevenue || 0), 0
  )

  const totalHistoricalCommission = historicalMetrics.reduce(
    (sum, month) => sum + (month.potentialCommission || 0), 0
  )

  return (
    <div className={cn("space-y-6", className)}>
      
      {/* Header with monetization status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Suas Métricas de Performance
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Acompanhe o valor que a plataforma gera para o seu negócio
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={isMonetizationActive ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  isMonetizationActive ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                )}
              >
                {isMonetizationActive ? "Cobrança Ativa" : "Período Gratuito"}
              </Badge>
              {!isMonetizationActive && showPreview && (
                <div className="text-xs text-gray-500 text-right">
                  <div>Preview do sistema de cobrança</div>
                  <div>Comissão: {(commissionRate * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current month metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalBookings}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Gerada</p>
                <p className="text-2xl font-bold text-green-600">
                  €{metrics.totalRevenue.toFixed(2)}
                </p>
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
                <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-purple-600">
                  {conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{metrics.averageBookingValue.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Value generated for braider */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Valor Gerado pela Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* This month */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Este Mês</h4>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-xl font-bold text-green-600">
                  €{metrics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {isMonetizationActive ? 'Comissão Cobrada' : 'Comissão Potencial'}
                </p>
                <p className="text-xl font-bold text-gray-700">
                  €{metrics.potentialCommission.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seu Lucro Líquido</p>
                <p className="text-xl font-bold text-green-700">
                  €{(metrics.totalRevenue - metrics.potentialCommission).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Historical data */}
          {historicalMetrics.length > 1 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Últimos 6 Meses</h4>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Total Acumulado
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    €{totalHistoricalRevenue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {isMonetizationActive ? 'Comissão Cobrada' : 'Comissão Potencial'}
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    €{totalHistoricalCommission.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seu Lucro Líquido</p>
                  <p className="text-xl font-bold text-blue-700">
                    €{(totalHistoricalRevenue - totalHistoricalCommission).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Monetization preview/info */}
      {showPreview && !isMonetizationActive && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-600" />
              Como Funciona a Cobrança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Sistema de Comissão</h4>
              <p className="text-gray-700 text-sm mb-3">
                Quando a cobrança for ativada, você pagará apenas <strong>{(commissionRate * 100).toFixed(1)}%</strong> sobre 
                cada serviço que completar através da plataforma.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor do serviço:</span>
                  <span className="font-semibold">€50.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Comissão da plataforma ({(commissionRate * 100).toFixed(1)}%):</span>
                  <span className="text-red-600 font-semibold">-€{(50 * commissionRate).toFixed(2)}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Você recebe:</span>
                  <span className="text-green-600 font-bold">€{(50 * (1 - commissionRate)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Período de Transição</p>
                <p className="text-sm text-gray-700">
                  Quando a cobrança for ativada, você terá {gracePeriodDays} dias de aviso prévio 
                  antes do início das cobranças.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
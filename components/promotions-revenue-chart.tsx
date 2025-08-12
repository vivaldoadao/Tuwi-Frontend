"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Euro, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CreditCard,
  Users,
  BarChart3
} from "lucide-react"

interface RevenueData {
  total_revenue: number
  monthly_revenue: number
  weekly_revenue: number
  daily_revenue: number
  total_transactions: number
  active_promotions: number
  revenue_growth: {
    monthly_percentage: number
    weekly_percentage: number
    is_positive: boolean
  }
  top_package_type: {
    type: string
    revenue: number
    count: number
  }
  recent_transactions: Array<{
    date: string
    amount: number
    type: string
    user_name: string
  }>
}

interface PromotionsRevenueChartProps {
  className?: string
}

export function PromotionsRevenueChart({ className }: PromotionsRevenueChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RevenueData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/promotions/revenue')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)

    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const getPackageTypeLabel = (type: string) => {
    switch (type) {
      case 'profile_highlight': return 'Perfil em Destaque'
      case 'hero_banner': return 'Banner Hero'
      case 'combo': return 'Pacote Combo'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>❌ {error || 'Dados não disponíveis'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.total_transactions} transações
            </p>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthly_revenue)}</div>
            <div className="flex items-center text-xs">
              {data.revenue_growth.is_positive ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={data.revenue_growth.is_positive ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(data.revenue_growth.monthly_percentage)}%
              </span>
              <span className="text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Promoções Ativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_promotions}</div>
            <p className="text-xs text-muted-foreground">
              Gerando receita atualmente
            </p>
          </CardContent>
        </Card>

        {/* Receita Semanal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.weekly_revenue)}</div>
            <div className="flex items-center text-xs">
              <span className={data.revenue_growth.weekly_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                {data.revenue_growth.weekly_percentage >= 0 ? '+' : ''}{data.revenue_growth.weekly_percentage}%
              </span>
              <span className="text-muted-foreground ml-1">vs semana anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pacote Mais Popular */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pacote Mais Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{getPackageTypeLabel(data.top_package_type.type)}</p>
                  <p className="text-sm text-gray-600">{data.top_package_type.count} vendas</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(data.top_package_type.revenue)}</p>
                  <Badge className="bg-green-100 text-green-800">
                    Top Seller
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_transactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{transaction.user_name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getPackageTypeLabel(transaction.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <CreditCard className="h-3 w-3 text-gray-400 ml-auto" />
                  </div>
                </div>
              ))}
              
              {data.recent_transactions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma transação recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Diária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.daily_revenue)}</p>
              <p className="text-sm text-gray-600">Hoje</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.weekly_revenue / 7)}</p>
              <p className="text-sm text-gray-600">Média Diária (7d)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.monthly_revenue / 30)}</p>
              <p className="text-sm text-gray-600">Média Diária (30d)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
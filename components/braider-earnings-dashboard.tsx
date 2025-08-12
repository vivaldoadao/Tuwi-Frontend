"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  PieChart,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EarningsData {
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
  monthlyComparison: number // percentage change from previous month
  servicesCompleted: number
  averageServiceValue: number
  commissionRate: number
}

interface BraiderEarningsDashboardProps {
  braiderId: string
}

// Default data for loading state
const defaultEarningsData: EarningsData = {
  totalEarnings: 0,
  monthlyEarnings: 0,
  pendingCommissions: 0,
  platformCommission: 0,
  netEarnings: 0,
  lastPayment: null,
  monthlyComparison: 0,
  servicesCompleted: 0,
  averageServiceValue: 0,
  commissionRate: 0.10
}

export function BraiderEarningsDashboard({ braiderId }: BraiderEarningsDashboardProps) {
  const [earnings, setEarnings] = useState<EarningsData>(defaultEarningsData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEarnings = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/braider/${braiderId}/earnings`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch earnings: ${response.statusText}`)
        }
        
        const data = await response.json()
        setEarnings(data)
      } catch (err) {
        console.error('Error loading earnings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load earnings')
        // Use default data on error
        setEarnings(defaultEarningsData)
      } finally {
        setLoading(false)
      }
    }

    if (braiderId) {
      loadEarnings()
    }
  }, [braiderId])

  const exportEarnings = () => {
    // Funcionalidade de exportar relatório
    console.log('Exportando relatório de ganhos...')
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Erro ao carregar dados financeiros</p>
              <p className="text-sm">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header com resumo principal */}
      <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Resumo Financeiro
            </CardTitle>
            <Button onClick={exportEarnings} variant="outline" size="sm" className="border-green-300">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Ganhos Totais</p>
              <p className="text-3xl font-bold text-green-800">€{earnings.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Desde o início</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Este Mês</p>
              <p className="text-3xl font-bold text-green-800">€{earnings.netEarnings.toFixed(2)}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {earnings.monthlyComparison > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  earnings.monthlyComparison > 0 ? "text-green-600" : "text-red-500"
                )}>
                  {earnings.monthlyComparison > 0 ? '+' : ''}{earnings.monthlyComparison.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Pendente</p>
              <p className="text-3xl font-bold text-orange-600">€{earnings.pendingCommissions.toFixed(2)}</p>
              <p className="text-xs text-orange-600 mt-1">Aguardando pagamento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de métricas detalhadas */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        
        {/* Receita Bruta */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Bruto
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Receita Mensal Bruta</p>
              <p className="text-3xl font-bold text-gray-900">€{earnings.monthlyEarnings.toFixed(2)}</p>
              <p className="text-sm text-blue-600 font-medium">{earnings.servicesCompleted} serviços concluídos</p>
            </div>
          </CardContent>
        </Card>

        {/* Comissão da Plataforma */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {(earnings.commissionRate * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Comissão da Plataforma</p>
              <p className="text-3xl font-bold text-orange-600">€{earnings.platformCommission.toFixed(2)}</p>
              <p className="text-sm text-orange-600 font-medium">Taxa da plataforma</p>
            </div>
          </CardContent>
        </Card>

        {/* Ganhos Líquidos */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Líquido
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Ganhos Líquidos</p>
              <p className="text-3xl font-bold text-green-600">€{earnings.netEarnings.toFixed(2)}</p>
              <p className="text-sm text-green-600 font-medium">Após comissões</p>
            </div>
          </CardContent>
        </Card>

        {/* Valor Médio por Serviço */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Média
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Valor Médio por Serviço</p>
              <p className="text-3xl font-bold text-purple-600">€{earnings.averageServiceValue.toFixed(2)}</p>
              <p className="text-sm text-purple-600 font-medium">Por atendimento</p>
            </div>
          </CardContent>
        </Card>

        {/* Último Pagamento */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  earnings.lastPayment?.status === 'completed' && "bg-green-100 text-green-700",
                  earnings.lastPayment?.status === 'pending' && "bg-yellow-100 text-yellow-700",
                  earnings.lastPayment?.status === 'processing' && "bg-blue-100 text-blue-700"
                )}
              >
                {earnings.lastPayment?.status === 'completed' && 'Pago'}
                {earnings.lastPayment?.status === 'pending' && 'Pendente'}
                {earnings.lastPayment?.status === 'processing' && 'Processando'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Último Pagamento</p>
              {earnings.lastPayment ? (
                <>
                  <p className="text-3xl font-bold text-indigo-600">€{earnings.lastPayment.amount.toFixed(2)}</p>
                  <p className="text-sm text-indigo-600 font-medium">
                    {new Date(earnings.lastPayment.date).toLocaleDateString('pt-BR')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-400">€0.00</p>
                  <p className="text-sm text-gray-400 font-medium">Nenhum pagamento</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status do Sistema */}
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                Ativo
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Status da Conta</p>
              <p className="text-2xl font-bold text-teal-600">Verificada</p>
              <div className="flex items-center gap-1 text-sm text-teal-600">
                <CheckCircle className="h-4 w-4" />
                <span>Pagamentos habilitados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown de comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Breakdown de Comissões - Este Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Receita Bruta</span>
              </div>
              <span className="font-bold text-green-600">€{earnings.monthlyEarnings.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-gray-900">
                  Comissão da Plataforma ({(earnings.commissionRate * 100).toFixed(1)}%)
                </span>
              </div>
              <span className="font-bold text-orange-600">-€{earnings.platformCommission.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Ganhos Líquidos</span>
              </div>
              <span className="font-bold text-green-700 text-lg">€{earnings.netEarnings.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Margem de Lucro</span>
              <span className="text-sm font-bold text-gray-900">
                {((earnings.netEarnings / earnings.monthlyEarnings) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={(earnings.netEarnings / earnings.monthlyEarnings) * 100} 
              className="h-3" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos - Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
            <Button variant="outline" size="sm">
              Ver Histórico Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2025-01-05', amount: 520.25, status: 'completed' },
              { date: '2024-12-05', amount: 445.80, status: 'completed' },
              { date: '2024-11-05', amount: 387.95, status: 'completed' },
            ].map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {payment.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : payment.status === 'pending' ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(payment.date).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.status === 'completed' ? 'Pagamento realizado' : 
                       payment.status === 'pending' ? 'Aguardando processamento' : 
                       'Falha no pagamento'}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-green-600">€{payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
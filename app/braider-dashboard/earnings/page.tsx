"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DollarSign,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Users
} from "lucide-react"
import { BraiderEarningsDashboard } from "@/components/braider-earnings-dashboard"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  date: string
  customerName: string
  serviceName: string
  serviceAmount: number
  commissionRate: number
  commissionAmount: number
  netEarnings: number
  status: 'completed' | 'pending' | 'cancelled'
  paymentDate?: string
}

// Interface será populada via API

export default function BraiderEarningsPage() {
  const { user } = useAuth()
  const braiderId = user?.id || "braider-1"
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('current_month')

  // Carregar transações via API
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/braider/${braiderId}/earnings`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (braiderId && braiderId !== "braider-1") {
      loadTransactions()
    } else {
      setLoading(false)
    }
  }, [braiderId])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalEarnings = transactions.reduce((sum, t) => sum + t.netEarnings, 0)
  const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0)
  const pendingEarnings = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.netEarnings, 0)

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Meus Ganhos 💰
                </h1>
                <p className="text-white/90 text-lg">
                  Acompanhe seus ganhos, comissões e histórico financeiro
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Sistema de comissões da plataforma Wilnara Tranças
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">€{totalEarnings.toFixed(2)}</div>
              <div className="text-white/80 font-medium">Ganhos Totais</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de Ganhos */}
      <BraiderEarningsDashboard braiderId={braiderId} />

      {/* Filtros e Histórico Detalhado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico Detalhado de Transações
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_month">Mês Passado</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                <SelectItem value="all_time">Todo o Período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumo dos Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">€{filteredTransactions.reduce((sum, t) => sum + t.netEarnings, 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Ganhos Líquidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">€{filteredTransactions.reduce((sum, t) => sum + t.commissionAmount, 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Comissões Pagas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</div>
              <div className="text-sm text-gray-600">Transações</div>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Valor Serviço</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Ganho Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{transaction.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-sm">{transaction.serviceName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{transaction.serviceAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        €{transaction.commissionAmount.toFixed(2)}
                        <div className="text-xs text-gray-500">
                          ({(transaction.commissionRate * 100).toFixed(1)}%)
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        €{transaction.netEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                          className={cn(
                            transaction.status === 'completed' && "bg-green-100 text-green-700",
                            transaction.status === 'pending' && "bg-yellow-100 text-yellow-700",
                            transaction.status === 'cancelled' && "bg-red-100 text-red-700"
                          )}
                        >
                          {transaction.status === 'completed' ? 'Concluído' : 
                           transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.paymentDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="text-green-600 font-medium">Pago</div>
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.paymentDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-yellow-600 font-medium">Aguardando</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <PieChart className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">Nenhuma transação encontrada</p>
                        <p className="text-xs text-gray-400">Ajuste os filtros para ver mais resultados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
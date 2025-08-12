"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  CreditCard,
  AlertCircle
} from "lucide-react"
import { AdminGuard } from "@/components/role-guard"
import { AdminMonetizationControls } from "@/components/admin-monetization-controls"
import { BraiderCommissionDetails } from "@/components/braider-commission-details"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BraiderCommission {
  id: string
  name: string
  email: string
  profileImage?: string
  totalBookings: number
  completedBookings: number
  totalRevenue: number
  totalCommissions: number
  lastPayment?: string
  status: 'active' | 'suspended' | 'pending'
  joinedAt: string
  currentMonthRevenue: number
  currentMonthCommissions: number
}

interface CommissionStats {
  totalCommissions: number
  monthlyCommissions: number
  totalBraiders: number
  activeBraiders: number
  pendingPayments: number
  averageCommission: number
}

// Dados serão carregados via API

export default function CommissionsPage() {
  const { toast } = useToast()
  const [braiders, setBraiders] = useState<BraiderCommission[]>([])
  const [filteredBraiders, setFilteredBraiders] = useState<BraiderCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('current_month')
  const [selectedBraider, setSelectedBraider] = useState<{id: string, name: string} | null>(null)

  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    monthlyCommissions: 0,
    totalBraiders: 0,
    activeBraiders: 0,
    pendingPayments: 0,
    averageCommission: 0
  })

  // Load data from API
  useEffect(() => {
    const loadCommissionsData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/commissions')
        if (!response.ok) {
          throw new Error(`Failed to fetch commissions: ${response.statusText}`)
        }
        
        const data = await response.json()
        setBraiders(data.braiders || [])
        setStats(data.stats || {
          totalCommissions: 0,
          monthlyCommissions: 0,
          totalBraiders: 0,
          activeBraiders: 0,
          pendingPayments: 0,
          averageCommission: 0
        })
        
        toast({
          title: "✅ Dados Carregados",
          description: `${data.braiders?.length || 0} trancistas encontradas`,
        })
      } catch (error) {
        console.error('Error loading commissions data:', error)
        toast({
          title: "❌ Erro",
          description: "Falha ao carregar dados de comissões. Usando dados padrão.",
          variant: "destructive"
        })
        // Keep empty arrays on error
        setBraiders([])
        setStats({
          totalCommissions: 0,
          monthlyCommissions: 0,
          totalBraiders: 0,
          activeBraiders: 0,
          pendingPayments: 0,
          averageCommission: 0
        })
      } finally {
        setLoading(false)
      }
    }

    loadCommissionsData()
  }, [])

  // Filter braiders
  useEffect(() => {
    let filtered = braiders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(braider => 
        braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        braider.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(braider => braider.status === statusFilter)
    }

    setFilteredBraiders(filtered)
  }, [braiders, searchTerm, statusFilter])

  const handleProcessPayment = async (braiderId: string) => {
    try {
      const response = await fetch('/api/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_payments',
          braiderIds: [braiderId]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process payment')
      }

      const result = await response.json()
      
      toast({
        title: "✅ Pagamento Processado",
        description: result.message || "O pagamento da comissão foi processado com sucesso.",
      })

      // Recarregar dados
      const reloadResponse = await fetch('/api/admin/commissions')
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setBraiders(data.braiders || [])
        setStats(data.stats)
      }
      
    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "❌ Erro",
        description: "Falha ao processar pagamento. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const exportCommissions = () => {
    // Mock export functionality
    toast({
      title: "Relatório Exportado",
      description: "O relatório de comissões foi baixado com sucesso.",
    })
  }

  return (
    <AdminGuard redirectTo="/login">
      <div className="space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold font-heading mb-2">
                    Gestão de Comissões 💰
                  </h1>
                  <p className="text-white/90 text-lg">
                    Gerencie comissões e pagamentos das trancistas
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    Acompanhe receitas, calcule comissões e processe pagamentos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">€{stats.monthlyCommissions.toFixed(2)}</div>
                <div className="text-white/80 font-medium">Comissões do Mês</div>
              </div>
            </div>
          </div>
        </div>

        {/* Monetization Controls */}
        <AdminMonetizationControls />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-1">Comissões Totais</p>
                  <p className="text-3xl font-bold text-green-700">€{stats.totalCommissions.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">Todas as comissões geradas</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Comissões do Mês</p>
                  <p className="text-3xl font-bold text-blue-700">€{stats.monthlyCommissions.toFixed(2)}</p>
                  <p className="text-xs text-blue-600 mt-1">Mês atual</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Trancistas Ativas</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.activeBraiders}</p>
                  <p className="text-xs text-purple-600 mt-1">De {stats.totalBraiders} total</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium mb-1">Média por Trancista</p>
                  <p className="text-3xl font-bold text-orange-700">€{stats.averageCommission.toFixed(2)}</p>
                  <p className="text-xs text-orange-600 mt-1">Comissão média</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trancistas e Comissões
              </span>
              <Button onClick={exportCommissions} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Buscar trancistas</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por nome ou email..."
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
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
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

            {/* Braiders Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trancista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Serviços</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Comissões</TableHead>
                    <TableHead className="text-right">Mês Atual</TableHead>
                    <TableHead>Último Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                        </TableCell>
                        {[...Array(7)].map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredBraiders.length > 0 ? (
                    filteredBraiders.map((braider) => (
                      <TableRow key={braider.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">
                                {braider.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{braider.name}</div>
                              <div className="text-sm text-gray-600">{braider.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={braider.status === 'active' ? 'default' : braider.status === 'pending' ? 'secondary' : 'destructive'}
                            className={cn(
                              braider.status === 'active' && "bg-green-100 text-green-700",
                              braider.status === 'pending' && "bg-yellow-100 text-yellow-700",
                              braider.status === 'suspended' && "bg-red-100 text-red-700"
                            )}
                          >
                            {braider.status === 'active' ? 'Ativa' : braider.status === 'pending' ? 'Pendente' : 'Suspensa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">{braider.completedBookings}</div>
                          <div className="text-xs text-gray-600">de {braider.totalBookings}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          €{braider.totalRevenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">
                          €{braider.totalCommissions.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">€{braider.currentMonthCommissions.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">€{braider.currentMonthRevenue.toFixed(2)} receita</div>
                        </TableCell>
                        <TableCell>
                          {braider.lastPayment ? (
                            <div className="text-sm">
                              <div>{new Date(braider.lastPayment).toLocaleDateString('pt-BR')}</div>
                              <div className="text-xs text-green-600">Pago</div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              Pendente
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedBraider({id: braider.id, name: braider.name})}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {braider.status === 'active' && braider.currentMonthCommissions > 0 && (
                              <Button 
                                size="sm" 
                                onClick={() => handleProcessPayment(braider.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500">Nenhuma trancista encontrada</p>
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

        {/* Braider Commission Details Dialog */}
        {selectedBraider && (
          <BraiderCommissionDetails
            braiderId={selectedBraider.id}
            braiderName={selectedBraider.name}
            isOpen={!!selectedBraider}
            onClose={() => setSelectedBraider(null)}
          />
        )}

      </div>
    </AdminGuard>
  )
}
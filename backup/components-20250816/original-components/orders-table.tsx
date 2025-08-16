"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  Package,
  RefreshCw
} from "lucide-react"
import { formatEuro } from "@/lib/currency"
import { getAllOrdersAdmin, type Order, type OrderStatus } from "@/lib/data-supabase"
import { toast } from "react-hot-toast"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200", 
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
}

const statusLabels = {
  pending: "Pendente",
  processing: "Processando",
  shipped: "Enviado", 
  delivered: "Entregue",
  cancelled: "Cancelado"
}

interface OrdersTableProps {
  className?: string
}

export default function OrdersTable({ className }: OrdersTableProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as OrderStatus | "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  })
  
  const itemsPerPage = 10

  const fetchOrders = async (page = 1, resetData = false) => {
    try {
      setLoading(true)
      
      const filterParams = {
        ...(filters.status && filters.status !== "all" && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.minAmount && { minAmount: parseFloat(filters.minAmount) }),
        ...(filters.maxAmount && { maxAmount: parseFloat(filters.maxAmount) })
      }

      const result = await getAllOrdersAdmin(page, itemsPerPage, filterParams)
      
      if (resetData) {
        setOrders(result.orders)
      } else {
        setOrders(prev => page === 1 ? result.orders : [...prev, ...result.orders])
      }
      
      setTotalOrders(result.total)
      setHasMore(result.hasMore)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1, true)
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId)
      
      // Use the new API route that has admin privileges
      const response = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        toast.success(`Status atualizado para ${statusLabels[newStatus]}`)
      } else {
        toast.error(result.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setUpdating(null)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchOrders(currentPage + 1, false)
    }
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: ""
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getItemsCount = (items: any[]) => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
          <p className="text-gray-600">Gerencie todos os pedidos da loja</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchOrders(1, true)}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/create-initial-tracking', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}) // No orderId = process all orders
                })
                const result = await response.json()
                if (result.success) {
                  toast.success(`Histórico criado para ${result.details.processedOrders} pedidos!`)
                } else {
                  toast.error('Erro ao criar histórico')
                }
              } catch (error) {
                console.error('Error creating initial tracking:', error)
                toast.error('Erro ao criar histórico')
              }
            }}
            variant="outline"
            className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            📝 Criar Histórico (Todos)
          </Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/add-order-numbers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                })
                const result = await response.json()
                if (result.success) {
                  toast.success(`Números de pedido adicionados! ${result.details.ordersUpdated} pedidos atualizados.`)
                  // Refresh the orders list
                  fetchOrders(1, true)
                } else {
                  toast.error('Erro ao adicionar números dos pedidos')
                }
              } catch (error) {
                console.error('Error adding order numbers:', error)
                toast.error('Erro ao adicionar números dos pedidos')
              }
            }}
            variant="outline"
            className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            🔢 Adicionar Números (Todos)
          </Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/setup-users-table', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                })
                const result = await response.json()
                if (result.success) {
                  toast.success('Tabela de usuários configurada com sucesso!')
                } else {
                  toast.error('Erro ao configurar tabela de usuários')
                }
              } catch (error) {
                console.error('Error setting up users table:', error)
                toast.error('Erro ao configurar tabela de usuários')
              }
            }}
            variant="outline"
            className="gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            👤 Setup Usuários
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-accent-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data inicial</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data final</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Min Amount */}
            <div className="space-y-2">
              <Label htmlFor="minAmount">Valor mínimo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Valor máximo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="999.99"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {totalOrders} {totalOrders === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </div>
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900">Pedido</TableHead>
                  <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
                  <TableHead className="font-semibold text-gray-900">Items</TableHead>
                  <TableHead className="font-semibold text-gray-900">Total</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Data</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && currentPage === 1 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Carregando pedidos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                        <Package className="h-8 w-8" />
                        <p>Nenhum pedido encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-mono text-sm">
                            #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                          </div>
                          {order.paymentIntentId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Stripe: {order.paymentIntentId.slice(-8)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-600">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{getItemsCount(order.items)} items</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{formatEuro(order.total)}</div>
                        {order.shippingCost > 0 && (
                          <div className="text-xs text-gray-500">
                            + {formatEuro(order.shippingCost)} frete
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status]} border`}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            
                            {order.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'processing')}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Marcar como processando
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === 'processing' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Marcar como enviado
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === 'shipped' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Marcar como entregue
                              </DropdownMenuItem>
                            )}
                            
                            {['pending', 'processing'].includes(order.status) && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                className="gap-2 text-red-600"
                              >
                                <Edit className="h-4 w-4" />
                                Cancelar pedido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="p-6 border-t border-gray-200 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Carregar mais pedidos
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
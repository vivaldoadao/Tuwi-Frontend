"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllOrdersAdmin, type Order } from "@/lib/data-supabase"
import { ShoppingCart, Euro, TrendingUp, CheckCircle, Package, Clock, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { formatEuro } from "@/lib/currency"
import OrdersTable from "@/components/orders-table"

export default function DashboardOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    averageOrderValue: 0
  })

  useEffect(() => {
    const fetchOrdersStats = async () => {
      setLoading(true)
      try {
        // Fetch all orders for stats (no pagination for overview)
        const result = await getAllOrdersAdmin(1, 1000)
        const allOrders = result.orders
        
        setOrders(allOrders)
        
        // Calculate stats
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0)
        const completedOrders = allOrders.filter(order => order.status === "delivered").length
        const pendingOrders = allOrders.filter(order => order.status === "pending").length
        const processingOrders = allOrders.filter(order => order.status === "processing").length
        const averageOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0

        setStats({
          totalRevenue,
          totalOrders: allOrders.length,
          completedOrders,
          pendingOrders,
          processingOrders,
          averageOrderValue
        })
      } catch (error) {
        console.error('Error fetching orders stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchOrdersStats()
    }
  }, [user])

  if (!user) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Gestão de Pedidos 🛒
                </h1>
                <p className="text-white/90 text-lg">
                  Monitore e gerencie todos os pedidos da plataforma
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Sistema completo de controle de vendas com Stripe
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
              <div className="text-white/80 font-medium">Total de Pedidos</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{formatEuro(stats.totalRevenue)}</div>
              <div className="text-white/80 text-sm">Receita Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <div className="text-white/80 text-sm">Entregues</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <div className="text-white/80 text-sm">Pendentes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{formatEuro(stats.averageOrderValue)}</div>
              <div className="text-white/80 text-sm">Ticket Médio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Euro className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Online
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-3xl font-bold text-gray-900">{formatEuro(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 font-medium">Pagamentos via Stripe</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {stats.pendingOrders} novos
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-blue-600 font-medium">{stats.completedOrders} completados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Médio
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-3xl font-bold text-gray-900">{formatEuro(stats.averageOrderValue)}</p>
              <p className="text-sm text-yellow-600 font-medium">por pedido</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
              <p className="text-sm text-purple-600 font-medium">pedidos entregues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-800">{stats.pendingOrders}</p>
                <p className="text-sm text-yellow-600 font-medium">Pedidos Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{stats.processingOrders}</p>
                <p className="text-sm text-blue-600 font-medium">Em Processamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{stats.completedOrders}</p>
                <p className="text-sm text-green-600 font-medium">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <OrdersTable />
    </div>
  )
}
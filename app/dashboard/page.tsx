"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Package, ShoppingCart, Users, Euro, BarChart3, Bell, Plus, Eye, Settings, ChevronRight, Clock, ArrowUpRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getAllBraiders, allProducts, type Braider } from "@/lib/data"
import { getUserOrders, type Order } from "@/lib/orders"
import Link from "next/link"

export default function DashboardOverviewPage() {
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [orders, setOrders] = useState<Order[]>([]) 
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [fetchedBraiders, fetchedOrders] = await Promise.all([
        getAllBraiders(),
        getUserOrders("user-1700000000000") // Mock admin orders
      ])
      setBraiders(fetchedBraiders)
      setOrders(fetchedOrders)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calculate metrics
  const totalOrders = orders.length
  const totalProducts = allProducts.length
  const totalBraiders = braiders.length
  const pendingBraiders = braiders.filter(b => b.status === 'pending').length
  const approvedBraiders = braiders.filter(b => b.status === 'approved').length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const recentOrders = orders.slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-brand-primary via-brand-accent to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Dashboard Administrativo 🛠️
                </h1>
                <p className="text-white/90 text-lg">
                  Gerencie toda a plataforma Wilnara Tranças
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Visão geral do sistema e métricas principais
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalOrders}</div>
              <div className="text-white/80 font-medium">Total de Pedidos</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</div>
              <div className="text-white/80 text-sm">Receita Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{totalBraiders}</div>
              <div className="text-white/80 text-sm">Trancistas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{approvedBraiders}</div>
              <div className="text-white/80 text-sm">Aprovadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="text-white/80 text-sm">Produtos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Revenue Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Euro className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                +18%
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-3xl font-bold text-gray-900">€{totalRevenue.toFixed(0)}</p>
              <p className="text-sm text-green-600 font-medium">vs mês anterior</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {Math.round(totalOrders * 0.2)} novos
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-sm text-blue-600 font-medium">últimos 30 dias</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Braiders Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                {pendingBraiders} pendentes
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Trancistas</p>
              <p className="text-3xl font-bold text-gray-900">{totalBraiders}</p>
              <p className="text-sm text-purple-600 font-medium">{approvedBraiders} aprovadas</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Products Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                Estoque OK
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              <p className="text-sm text-orange-600 font-medium">todos disponíveis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ações Administrativas
              </CardTitle>
              <CardDescription>Acesso rápido às funcionalidades principais do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <Link href="/dashboard/orders">
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-sm font-medium">Pedidos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <Link href="/dashboard/braiders">
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">Trancistas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all">
                  <Link href="/dashboard/products">
                    <Package className="h-6 w-6" />
                    <span className="text-sm font-medium">Produtos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <Link href="/dashboard/settings">
                    <Settings className="h-6 w-6" />
                    <span className="text-sm font-medium">Configurações</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Orders */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold font-heading text-gray-900">Pedidos Recentes</CardTitle>
                <CardDescription>Últimos pedidos realizados na plataforma</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/dashboard/orders">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                            Pedido #{order.id.split("-")[1]}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {order.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {order.items.length} itens
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Status: {order.status}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-bold text-brand-accent text-lg">€{order.total.toFixed(2)}</div>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            {order.status}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium text-lg">Nenhum pedido recente</p>
                  <p className="text-gray-400 text-sm mb-6">Os pedidos aparecerão aqui conforme forem realizados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Platform Stats */}
          <Card className="bg-gradient-to-br from-brand-primary/10 to-purple-50 border-brand-primary/20 shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Taxa de Aprovação</span>
                  <span className="text-sm font-bold text-gray-900">{totalBraiders > 0 ? Math.round((approvedBraiders / totalBraiders) * 100) : 0}%</span>
                </div>
                <Progress value={totalBraiders > 0 ? (approvedBraiders / totalBraiders) * 100 : 0} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Produtos Disponíveis</span>
                  <span className="text-sm font-bold text-gray-900">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Satisfação Geral</span>
                  <span className="text-sm font-bold text-gray-900">94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* System Notifications */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingBraiders > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Trancistas pendentes</p>
                    <p className="text-xs text-gray-600">{pendingBraiders} solicitação(ões) aguardando aprovação</p>
                    <p className="text-xs text-yellow-600 font-medium">Requer atenção</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sistema atualizado</p>
                  <p className="text-xs text-gray-600">Plataforma funcionando perfeitamente</p>
                  <p className="text-xs text-blue-600 font-medium">Há 1 hora</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Backup realizado</p>
                  <p className="text-xs text-gray-600">Dados salvos com sucesso</p>
                  <p className="text-xs text-green-600 font-medium">Há 6 horas</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="w-full rounded-xl mt-4">
                Ver todas as notificações
              </Button>
            </CardContent>
          </Card>
          
          {/* Quick Links */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Links Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl hover:bg-purple-100">
                <Link href="/dashboard/braiders" className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span>Aprovar Trancistas</span>
                  {pendingBraiders > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-700">
                      {pendingBraiders}
                    </Badge>
                  )}
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl hover:bg-purple-100">
                <Link href="/dashboard/products" className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <span>Gerenciar Produtos</span>
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl hover:bg-purple-100">
                <Link href="/dashboard/orders" className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Ver Todos os Pedidos</span>
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl hover:bg-purple-100">
                <Link href="/dashboard/settings" className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
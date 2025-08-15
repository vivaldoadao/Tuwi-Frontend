"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CalendarCheck, Users, TrendingUp, Clock, Star, Calendar, Eye, MapPin, CheckCircle, Euro, BarChart3, Activity, Bell, Plus, ChevronRight, AlertCircle, DollarSign } from "lucide-react"
import { getBraiderBookings, getBraiderById, type Booking } from "@/lib/data"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BraiderGuard } from "@/components/role-guard"
import { BraiderEarningsDashboard } from "@/components/braider-earnings-dashboard"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function BraiderDashboardOverviewPage() {
  const { user } = useAuth()
  const [braiderId, setBraiderId] = useState<string | null>(null)
  const [braider, setBraider] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar o braider ID baseado no email do usuário
  useEffect(() => {
    const fetchBraiderId = async () => {
      if (!user?.email) return
      
      try {
        console.log('🔍 Fetching braider ID for user:', user.email)
        const response = await fetch(`/api/braiders/by-email?email=${encodeURIComponent(user.email)}`)
        
        if (response.ok) {
          const braiderData = await response.json()
          console.log('✅ Braider found:', braiderData)
          setBraiderId(braiderData.id)
          setBraider(braiderData)
        } else {
          console.error('❌ Braider not found for user:', user.email)
          setBraiderId(null)
          setBraider(null)
        }
      } catch (error) {
        console.error('❌ Error fetching braider ID:', error)
        setBraiderId(null)
        setBraider(null)
      }
    }
    
    fetchBraiderId()
  }, [user?.email])

  useEffect(() => {
    const fetchData = async () => {
      if (!braiderId) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        const braiderBookings = await getBraiderBookings(braiderId)
        setBookings(braiderBookings)
      } catch (error) {
        console.error('❌ Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [braiderId])

  // Enhanced Analytics Calculations
  const today = new Date()
  const thisWeek = bookings.filter(booking => {
    const bookingDate = new Date(booking.date)
    const diffTime = Math.abs(today.getTime() - bookingDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  })
  
  const thisMonth = bookings.filter(booking => {
    const bookingDate = new Date(booking.date)
    return bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear()
  })

  const totalBookings = bookings.length
  const confirmedBookings = bookings.filter(b => b.status === "Confirmado").length
  const pendingBookings = bookings.filter(b => b.status === "Pendente").length
  const cancelledBookings = bookings.filter(b => b.status === "Cancelado").length
  
  const monthlyRevenue = bookings
    .filter(b => {
      const bookingDate = new Date(b.date)
      return bookingDate.getMonth() === today.getMonth() && 
             bookingDate.getFullYear() === today.getFullYear() &&
             b.status === "Confirmado"
    })
    .reduce((sum, booking) => {
      const service = braider?.services.find(s => s.id === booking.serviceId)
      return sum + (service?.price || 0)
    }, 0)
  
  const uniqueClients = new Set(bookings.map(b => b.clientEmail)).size
  const upcomingBookings = bookings
    .filter(b => new Date(b.date) >= today && b.status !== "Cancelado")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)
  
  const averageRating = 4.8
  const profileViews = 156
  const completionRate = bookings.length > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-accent-500 via-accent-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full p-1 backdrop-blur-sm">
                <Image
                  src={braider?.profileImageUrl || "/placeholder.svg?height=80&width=80&text=T"}
                  alt={braider?.name || "Trancista"}
                  width={76}
                  height={76}
                  className="rounded-full object-cover w-full h-full"
                  unoptimized={true}
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Dashboard Executivo 📊
                </h1>
                <p className="text-white/90 text-lg">
                  Bem-vinda de volta, {braider?.name || "Trancista"}! 👋
                </p>
                <p className="text-white/80 text-sm mt-1">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalBookings}</div>
              <div className="text-white/80 font-medium">Total de Agendamentos</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">€{monthlyRevenue}</div>
              <div className="text-white/80 text-sm">Receita Mensal</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{thisWeek.length}</div>
              <div className="text-white/80 text-sm">Esta Semana</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{averageRating}⭐</div>
              <div className="text-white/80 text-sm">Avaliação</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <div className="text-white/80 text-sm">Taxa Conclusão</div>
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
                +12%
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-3xl font-bold text-gray-900">€{monthlyRevenue}</p>
              <p className="text-sm text-green-600 font-medium">vs mês anterior</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Bookings Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {pendingBookings} pendentes
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Agendamentos</p>
              <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
              <p className="text-sm text-blue-600 font-medium">{thisWeek.length} esta semana</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Rating Card */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Excelente
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
              <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
              <p className="text-sm text-yellow-600 font-medium">45 avaliações</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Completion Rate Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                Alto
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
              <Progress value={completionRate} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Dashboard Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading text-gray-900">💰 Ganhos e Comissões</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-700 px-3 py-1">
            Sistema Ativo
          </Badge>
        </div>
        {braiderId ? (
          <BraiderEarningsDashboard braiderId={braiderId} />
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-yellow-700">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Perfil de trancista não encontrado</p>
                  <p className="text-sm">Complete seu cadastro como trancista para acessar o dashboard.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                Ações Rápidas
              </CardTitle>
              <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-accent-50 hover:border-accent-300 transition-all">
                  <Link href="/braider-dashboard/availability">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm font-medium">Disponibilidade</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-accent-50 hover:border-accent-300 transition-all">
                  <Link href="/braider-dashboard/bookings">
                    <CalendarCheck className="h-6 w-6" />
                    <span className="text-sm font-medium">Agendamentos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all">
                  <Link href="/braider-dashboard/earnings">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm font-medium">Meus Ganhos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 rounded-xl hover:bg-accent-50 hover:border-accent-300 transition-all">
                  <Link href="/braider-dashboard/profile">
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">Perfil</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Bookings */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold font-heading text-gray-900">Próximos Agendamentos</CardTitle>
                <CardDescription>Seus próximos atendimentos programados</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/braider-dashboard/bookings">
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
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const service = braider?.services.find(s => s.id === booking.serviceId)
                    return (
                      <div
                        key={booking.id}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            booking.status === 'Confirmado' && "bg-green-100",
                            booking.status === 'Pendente' && "bg-yellow-100",
                            booking.status === 'Cancelado' && "bg-red-100"
                          )}>
                            {booking.status === 'Confirmado' && <CheckCircle className="h-6 w-6 text-green-600" />}
                            {booking.status === 'Pendente' && <Clock className="h-6 w-6 text-yellow-600" />}
                            {booking.status === 'Cancelado' && <AlertCircle className="h-6 w-6 text-red-600" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-accent-600 transition-colors">
                              {booking.clientName}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {booking.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {booking.bookingType === 'domicilio' ? 'Casa do cliente' : 'Meu estúdio'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{service?.name}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="font-bold text-accent-600 text-lg">€{service?.price || 0}</div>
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                booking.status === 'Confirmado' && "bg-green-100 text-green-700 border-green-200",
                                booking.status === 'Pendente' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                booking.status === 'Cancelado' && "bg-red-100 text-red-700 border-red-200"
                              )}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent-500 transition-colors" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium text-lg">Nenhum agendamento próximo</p>
                  <p className="text-gray-400 text-sm mb-6">Seus próximos atendimentos aparecerão aqui</p>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/braider-dashboard/availability">
                      <Plus className="h-4 w-4 mr-2" />
                      Configurar Disponibilidade
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Performance Insights */}
          <Card className="bg-gradient-to-br from-accent-50 to-purple-50 border-accent-200 shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Taxa de Ocupação</span>
                  <span className="text-sm font-bold text-gray-900">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Satisfação do Cliente</span>
                  <span className="text-sm font-bold text-gray-900">96%</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Pontualidade</span>
                  <span className="text-sm font-bold text-gray-900">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* Notifications */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Novo agendamento</p>
                  <p className="text-xs text-gray-600">Maria Silva agendou para amanhã às 14:00</p>
                  <p className="text-xs text-blue-600 font-medium">Há 2 minutos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Lembrete</p>
                  <p className="text-xs text-gray-600">Atendimento em 1 hora - Ana Costa</p>
                  <p className="text-xs text-yellow-600 font-medium">Há 15 minutos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Pagamento recebido</p>
                  <p className="text-xs text-gray-600">€65 de Joana Ferreira</p>
                  <p className="text-xs text-green-600 font-medium">Há 1 hora</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="w-full rounded-xl mt-4">
                Ver todas as notificações
              </Button>
            </CardContent>
          </Card>
          
          {/* Weekly Goals */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Metas da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Receita</span>
                  <span className="text-sm font-bold text-gray-900">€320 / €400</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Atendimentos</span>
                  <span className="text-sm font-bold text-gray-900">8 / 12</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Novos Clientes</span>
                  <span className="text-sm font-bold text-gray-900">3 / 5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
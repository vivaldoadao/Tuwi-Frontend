"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import { getUserOrdersByEmail, getUserByEmail, getUserBookingsConfirmed, type Order, type User, type UserBooking } from "@/lib/data-supabase"
import { 
  User as UserIcon, 
  MapPin, 
  Home, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  Heart, 
  Mail, 
  Phone, 
  Edit3, 
  Save, 
  Camera,
  Settings,
  Award,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Euro,
  LogOut,
  Plus,
  MessageSquare,
  Send,
  Search,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Video,
  Circle,
  MoreVertical
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserOrdersSummary } from "@/components/user-orders-summary"
import { RealtimeChat } from "@/components/realtime-chat"
import { toast } from "react-hot-toast"

// Real-time chat is now handled by the RealtimeChat component

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<UserBooking[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview")
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "Lisboa, Portugal", // This will remain static for now
    bio: "Apaixonada por tranças e cuidados capilares afro-brasileiros." // This will remain static for now
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else {
      const fetchUserData = async () => {
        try {
          // Load user data from database
          setLoadingUser(true)
          const dbUserData = await getUserByEmail(user.email)
          setDbUser(dbUserData)
          
          if (dbUserData) {
            setUserInfo({
              name: dbUserData.name || "",
              email: dbUserData.email || "",
              phone: dbUserData.phone || "",
              address: "Lisboa, Portugal", // Static for now
              bio: "Apaixonada por tranças e cuidados capilares afro-brasileiros." // Static for now
            })
          } else {
            // Fallback to auth context data
            setUserInfo({
              name: user.name || "",
              email: user.email || "",
              phone: "",
              address: "Lisboa, Portugal",
              bio: "Apaixonada por tranças e cuidados capilares afro-brasileiros."
            })
          }
          setLoadingUser(false)

          // Load orders
          setLoadingOrders(true)
          const userOrders = await getUserOrdersByEmail(user.email)
          setOrders(userOrders)
          setLoadingOrders(false)

          // Load confirmed bookings
          setLoadingBookings(true)
          const userBookings = await getUserBookingsConfirmed(user.email)
          console.log('📅 User bookings loaded:', userBookings)
          setBookings(userBookings)
          setLoadingBookings(false)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setLoadingUser(false)
          setLoadingOrders(false)
          setLoadingBookings(false)
        }
      }
      
      fetchUserData()
    }
  }, [user, router])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    
    try {
      console.log('💾 Saving profile changes:', userInfo)
      
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          updates: {
            name: userInfo.name.trim(),
            phone: userInfo.phone.trim() || null
          }
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Profile updated successfully')
        // Re-fetch user data to ensure we have the latest from the database
        const updatedUser = await getUserByEmail(user.email)
        if (updatedUser) {
          setDbUser(updatedUser)
          setUserInfo(prev => ({
            ...prev,
            name: updatedUser.name || "",
            phone: updatedUser.phone || ""
          }))
        }
        setIsEditing(false)
        toast.success('Perfil atualizado com sucesso! 🎉')
      } else {
        console.error('❌ Failed to update profile:', result.error)
        toast.error(`Erro ao atualizar perfil: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Unexpected error saving profile:', error)
      toast.error('Erro inesperado ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    // In a real app, you would handle logout here
    router.push("/login")
  }

  // Real-time chat functionality is now handled by the RealtimeChat component

  if (!user) {
    return null
  }

  if (loadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "Cancelado":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getBookingStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Confirmado":
        return "bg-green-100 text-green-700 border-green-200"
      case "Pendente":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Cancelado":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }


  // Calculate user stats
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const totalBookings = bookings.length
  const totalBookingSpent = bookings.reduce((sum, booking) => sum + (booking.service?.price || 0), 0)
  const favoriteItems = 12 // Mock data

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                  <UserIcon className="h-12 w-12" />
                </div>
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-purple-500 hover:bg-gray-100 rounded-full shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  {userInfo.name} 👋
                </h1>
                <p className="text-white/90 text-lg">
                  Bem-vinda ao seu perfil pessoal
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Gerencie suas informações e acompanhe suas atividades
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-white/80 text-sm">Pedidos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">€{(totalSpent + totalBookingSpent).toFixed(0)}</div>
              <div className="text-white/80 text-sm">Gasto Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{totalBookings}</div>
              <div className="text-white/80 text-sm">Agendamentos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{favoriteItems}</div>
              <div className="text-white/80 text-sm">Favoritos</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - User Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Personal Information */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Nome</Label>
                        <Input
                          id="name"
                          value={userInfo.name}
                          onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold">Telefone</Label>
                        <Input
                          id="phone"
                          value={userInfo.phone}
                          onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-semibold">Localização</Label>
                        <Input
                          id="address"
                          value={userInfo.address}
                          onChange={(e) => setUserInfo({...userInfo, address: e.target.value})}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-semibold">Biografia</Label>
                        <Textarea
                          id="bio"
                          value={userInfo.bio}
                          onChange={(e) => setUserInfo({...userInfo, bio: e.target.value})}
                          rows={3}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                        >
                          {saving ? (
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{userInfo.email}</p>
                          <p className="text-sm text-gray-600">Email</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{userInfo.phone}</p>
                          <p className="text-sm text-gray-600">Telefone</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{userInfo.address}</p>
                          <p className="text-sm text-gray-600">Localização</p>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Sobre mim</p>
                        <p className="text-sm text-gray-700">{userInfo.bio}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Total Gasto</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">€{(totalSpent + totalBookingSpent).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">Pedidos</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-gray-900">Agendamentos</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-200">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span className="font-semibold text-gray-900">Favoritos</span>
                    </div>
                    <span className="text-lg font-bold text-pink-600">{favoriteItems}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Ações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/products">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Explorar Produtos
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/braiders">
                      <Award className="h-4 w-4 mr-2" />
                      Encontrar Trancistas
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/messages">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Minhas Mensagens
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/favorites">
                      <Heart className="h-4 w-4 mr-2" />
                      Meus Favoritos
                    </Link>
                  </Button>
                  <Separator />
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da Conta
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content with Tabs */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-2">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white font-semibold"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bookings" 
                    className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white font-semibold"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendamentos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="messages" 
                    className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white font-semibold"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensagens
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Orders Section */}
                  <UserOrdersSummary orders={orders} loading={loadingOrders} />
                </TabsContent>

                {/* Bookings Tab */}
                <TabsContent value="bookings" className="space-y-6">
                  <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Agendamentos Confirmados ({totalBookings})
                          </CardTitle>
                          <CardDescription>
                            Seus serviços confirmados com trancistas
                          </CardDescription>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                          <Link href="/braiders">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Agendamento
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                <CardContent>
                  {loadingBookings ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-24 bg-gray-200 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium text-lg mb-2">Nenhum agendamento confirmado</p>
                      <p className="text-gray-400 text-sm mb-6">Você ainda não tem agendamentos confirmados pelas trancistas</p>
                      <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                        <Link href="/braiders">
                          <Award className="h-4 w-4 mr-2" />
                          Encontrar Trancistas
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => {
                        return (
                          <div key={booking.id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Award className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg text-gray-900">
                                    {booking.braider?.name || "Trancista Desconhecida"}
                                  </h4>
                                  <p className="text-sm text-gray-600">{booking.service?.name || "Serviço Desconhecido"}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(booking.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {booking.time}
                                    </span>
                                    {booking.service?.price && (
                                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                                        <Euro className="h-3 w-3" />
                                        €{booking.service.price.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className={cn("text-sm", getBookingStatusBadgeClass(booking.status))}>
                                <span className="flex items-center gap-1">
                                  {getBookingStatusIcon(booking.status)}
                                  {booking.status}
                                </span>
                              </Badge>
                            </div>
                            
                            <div className="p-3 bg-white/80 rounded-xl">
                              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                {booking.bookingType === "domicilio" ? (
                                  <Home className="h-4 w-4 text-purple-600" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-semibold">
                                  {booking.bookingType === "domicilio" ? "Serviço ao Domicílio" : "No Salão da Trancista"}
                                </span>
                              </div>
                              {booking.bookingType === "domicilio" && booking.clientAddress && (
                                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.clientAddress}
                                </p>
                              )}
                              {booking.braider?.location && booking.bookingType === "trancista" && (
                                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.braider.location}
                                </p>
                              )}
                              {booking.braider?.contactPhone && (
                                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                  <Phone className="h-3 w-3" />
                                  {booking.braider.contactPhone}
                                </p>
                              )}
                              {booking.service?.durationMinutes && (
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  Duração: {booking.service.durationMinutes} minutos
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages" className="space-y-6">
                  <RealtimeChat 
                    colorTheme="purple"
                    showHeader={false}
                    className="h-auto lg:h-[calc(100vh-400px)] lg:min-h-[500px]"
                  />
                </TabsContent>

                {/* Hidden original chat content - keeping for reference */}
                {false && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-400px)] lg:min-h-[500px]">
                    {/* Conversations Sidebar */}
                    <div className="lg:col-span-1 h-full lg:h-auto">
                      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-[300px] lg:h-full flex flex-col">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Conversas
                            </CardTitle>
                            <Button size="icon" variant="outline" className="rounded-xl">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Pesquisar conversas..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 rounded-xl border-gray-200"
                            />
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0">
                          <ScrollArea className="h-full">
                            <div className="space-y-3 p-4">
                              {filteredConversations.map((conversation) => (
                                <div
                                  key={conversation.id}
                                  onClick={() => setSelectedConversation(conversation)}
                                  className={cn(
                                    "flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100",
                                    selectedConversation?.id === conversation.id ? "bg-purple-50 border border-purple-200" : ""
                                  )}
                                >
                                  <div className="relative flex-shrink-0">
                                    <Image
                                      src={conversation.participant.avatar}
                                      alt={conversation.participant.name}
                                      width={48}
                                      height={48}
                                      className="rounded-full object-cover"
                                      unoptimized={true}
                                    />
                                    <div className={cn(
                                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white",
                                      conversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                                    )} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">
                                          {conversation.participant.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0",
                                            conversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                                          )} />
                                          <span className="text-xs text-gray-500 truncate">
                                            {conversation.participant.isOnline ? "Online" : conversation.participant.lastSeen}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                          {conversation.lastMessage.timestamp}
                                        </span>
                                        {conversation.unreadCount > 0 && (
                                          <Badge className="bg-purple-500 text-white text-xs h-5 min-w-[20px] flex items-center justify-center">
                                            {conversation.unreadCount}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="w-full">
                                      <p className="text-xs text-gray-600 leading-relaxed overflow-hidden" 
                                         style={{
                                           display: '-webkit-box',
                                           WebkitLineClamp: 2,
                                           WebkitBoxOrient: 'vertical'
                                         }}>
                                        {conversation.lastMessage.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-3 h-full">
                      {selectedConversation ? (
                        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-[400px] lg:h-full flex flex-col">
                          {/* Chat Header */}
                          <CardHeader className="pb-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Image
                                    src={selectedConversation.participant.avatar}
                                    alt={selectedConversation.participant.name}
                                    width={50}
                                    height={50}
                                    className="rounded-full object-cover"
                                    unoptimized={true}
                                  />
                                  <div className={cn(
                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                                    selectedConversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                                  )} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {selectedConversation.participant.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {selectedConversation.participant.isOnline ? "Online" : selectedConversation.participant.lastSeen}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" className="rounded-xl">
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="rounded-xl">
                                  <Video className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="rounded-xl">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {/* Messages Area */}
                          <CardContent className="flex-1 p-0 overflow-hidden">
                            <ScrollArea className="h-full p-4">
                              <div className="space-y-4">
                                {conversationMessages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={cn(
                                      "flex",
                                      message.senderId === "user-current" ? "justify-end" : "justify-start"
                                    )}
                                  >
                                    <div className={cn(
                                      "max-w-[70%] p-3 rounded-2xl",
                                      message.senderId === "user-current"
                                        ? "bg-purple-500 text-white rounded-br-md"
                                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                                    )}>
                                      <p className="text-sm">{message.content}</p>
                                      <div className={cn(
                                        "flex items-center gap-1 mt-1 text-xs",
                                        message.senderId === "user-current" ? "text-purple-100" : "text-gray-500"
                                      )}>
                                        <span>{formatTimestamp(message.timestamp)}</span>
                                        {message.senderId === "user-current" && (
                                          message.isRead ? (
                                            <CheckCircle className="h-3 w-3" />
                                          ) : (
                                            <Circle className="h-3 w-3" />
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>

                          {/* Message Input */}
                          <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                              <Button size="icon" variant="outline" className="rounded-xl shrink-0">
                                <Paperclip className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="rounded-xl shrink-0">
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 relative">
                                <Textarea
                                  placeholder="Digite sua mensagem..."
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSendMessage()
                                    }
                                  }}
                                  className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-gray-200 pr-12"
                                  rows={1}
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl"
                                >
                                  <Smile className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl shrink-0"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-full flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma conversa</h3>
                            <p className="text-gray-600">Escolha uma conversa da lista para começar a chatear</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
                {/* End hidden original chat content */}
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth as useDjangoAuth } from "@/context/django-auth-context"
import { djangoAPI } from "@/lib/django-api"
import { 
  MapPin, 
  Home, 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Euro,
  Plus,
  Award,
  TrendingUp,
  MessageSquare,
  Phone,
  User as UserIcon,
  Mail,
  Save,
  Activity,
  Heart,
  ShoppingBag,
  Edit3,
  MessageCircle
} from "lucide-react"

// Tipos temporários (serão substituídos por dados reais da API Django)
interface Order {
  id: string
  total: number
  status: string
  created_at: string
}

interface UserBooking {
  id: string
  date: string
  time: string
  status: string
  braider?: {
    id: string
    name: string
    user_id?: string
    location?: string
    contactPhone?: string
  }
  service?: {
    name: string
    price: number
    durationMinutes: number
  }
  bookingType: string
  clientAddress?: string
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
}
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import AvatarWithInitials from "@/components/avatar-with-initials"
import { toast } from "react-hot-toast"

// Real-time chat is now handled by the RealtimeChat component

export default function ProfilePage() {
  const { user: djangoUser, updateProfile } = useDjangoAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<UserBooking[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [startingConversation, setStartingConversation] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || "overview")
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "Lisboa, Portugal", // This will remain static for now
    bio: "Apaixonada por tranças e cuidados capilares africanos.", // This will remain static for now
    avatar: ""
  })

  useEffect(() => {
    if (!djangoUser) {
      router.push("/login")
    } else {
      const fetchUserData = async () => {
        try {
          setLoadingUser(true)
          
          // Use Django user data directly from context
          if (djangoUser) {
            setUserInfo({
              name: djangoUser.name || "",
              email: djangoUser.email || "",
              phone: djangoUser.phone || "",
              address: "Lisboa, Portugal", // Static for now
              bio: "Apaixonada por tranças e cuidados capilares africanos.", // Static for now
              avatar: djangoUser.avatar_url || ""
            })
            setDbUser({
              id: djangoUser.id,
              name: djangoUser.name,
              email: djangoUser.email,
              phone: djangoUser.phone,
              avatar_url: djangoUser.avatar_url
            })
          }
          setLoadingUser(false)

          // Load orders (mock data for now since Django endpoints not implemented yet)
          setLoadingOrders(true)
          // TODO: Implement Django orders endpoint
          setOrders([]) // Empty for now
          setLoadingOrders(false)

          // Load confirmed bookings (mock data for now since Django endpoints not implemented yet)
          setLoadingBookings(true)
          // TODO: Implement Django bookings endpoint
          setBookings([]) // Empty for now
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
  }, [djangoUser, router])

  const handleSave = async () => {
    if (!djangoUser) return
    
    setSaving(true)
    
    try {
      console.log('💾 Saving profile changes:', userInfo)
      
      // Use Django API to update profile
      const success = await updateProfile({
        name: userInfo.name.trim(),
        phone: userInfo.phone.trim() || ""
      })
      
      if (success) {
        console.log('✅ Profile updated successfully')
        // Update local state with the new values
        setUserInfo(prev => ({
          ...prev,
          name: userInfo.name.trim(),
          phone: userInfo.phone.trim()
        }))
        setDbUser(prev => prev ? {
          ...prev,
          name: userInfo.name.trim(),
          phone: userInfo.phone.trim()
        } : null)
        setIsEditing(false)
        // Note: toast is already shown in the updateProfile function
      }
    } catch (error) {
      console.error('❌ Unexpected error saving profile:', error)
      toast.error('Erro inesperado ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (newAvatarUrl: string) => {
    // Update user info state with new avatar
    setUserInfo(prev => ({ ...prev, avatar: newAvatarUrl }))
    
    // Update dbUser state as well
    if (dbUser) {
      setDbUser(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null)
    }
    
    // TODO: Implement Django API call to update avatar
    // For now, just update local state
    
    toast.success('Avatar atualizado com sucesso! 🎉')
  }

  // Real-time chat functionality is now handled by the RealtimeChat component

  if (!djangoUser) {
    return null
  }

  if (loadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  // Handle start conversation from booking
  const handleStartConversationFromBooking = async (booking: UserBooking) => {
    if (!djangoUser || !booking.braider) {
      toast.error("Dados insuficientes para iniciar conversa")
      return
    }

    try {
      setStartingConversation(booking.id)
      
      // Create or get conversation with the braider
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: booking.braider.user_id || booking.braider.id, // Use braider's user_id first, fallback to braider ID
          initialMessage: `Olá ${booking.braider.name}! Tenho um agendamento confirmado para ${booking.service?.name} no dia ${new Date(booking.date).toLocaleDateString('pt-BR')} às ${booking.time}. Gostaria de conversar sobre os detalhes.`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar conversa')
      }

      toast.success("Conversa iniciada! Mudando para aba de mensagens...")
      
      // Switch to messages tab programmatically
      setTimeout(() => {
        // Use router to navigate to messages tab without reload
        router.push('/profile?tab=messages')
      }, 1000)

    } catch (error) {
      console.error('Error starting conversation from booking:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar conversa')
    } finally {
      setStartingConversation(null)
    }
  }


  // Calculate user stats
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const totalBookings = bookings.length
  const totalBookingSpent = bookings.reduce((sum, booking) => sum + (booking.service?.price || 0), 0)
  const favoriteItems = 12 // Mock data

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <AvatarWithInitials
                name={userInfo.name}
                avatarUrl={dbUser?.avatar_url}
                size="lg"
                editable={true}
                onAvatarChange={handleAvatarChange}
                userEmail={djangoUser?.email}
              />
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
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full"
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
                          className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-full"
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
                      <div className="p-3 bg-brand-50 rounded-xl border border-brand-200">
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
                  <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-600" />
                      <span className="font-semibold text-gray-900">Agendamentos</span>
                    </div>
                    <span className="text-lg font-bold text-brand-600">{totalBookings}</span>
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
            </div>

            {/* Main Content with Tabs */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-2">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-xl data-[state=active]:bg-accent-600 data-[state=active]:text-white font-semibold"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bookings" 
                    className="rounded-xl data-[state=active]:bg-accent-600 data-[state=active]:text-white font-semibold"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendamentos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="messages" 
                    className="rounded-xl data-[state=active]:bg-accent-600 data-[state=active]:text-white font-semibold"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensagens
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Orders Section - TODO: Implement with Django data */}
                  <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-brand-600" />
                        Meus Pedidos ({orders.length})
                      </CardTitle>
                      <CardDescription>
                        Seus pedidos de produtos da plataforma
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingOrders ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Carregando pedidos...</p>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 font-medium text-lg mb-2">Nenhum pedido encontrado</p>
                          <p className="text-gray-400 text-sm mb-6">Você ainda não fez nenhum pedido</p>
                          <Button asChild className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-full">
                            <Link href="/products">
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Explorar Produtos
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">Pedido #{order.id}</p>
                                  <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">€{order.total.toFixed(2)}</p>
                                  <Badge variant="outline">{order.status}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                        <Button asChild className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-full">
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
                      <Button asChild className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-full">
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
                                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                                  <Award className="h-6 w-6 text-accent-600" />
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
                                  <Home className="h-4 w-4 text-accent-600" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-accent-600" />
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

                            {/* Action Button - Only for confirmed bookings */}
                            {booking.status === "Confirmado" && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <Button
                                  onClick={() => handleStartConversationFromBooking(booking)}
                                  disabled={startingConversation === booking.id}
                                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                  {startingConversation === booking.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                      Iniciando conversa...
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="mr-2 h-4 w-4" />
                                      Conversar com {booking.braider?.name || 'trancista'}
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
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
                  <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Mensagens (Em Manutenção)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg mb-2">Sistema de mensagens temporariamente desabilitado</p>
                        <p className="text-gray-400 text-sm">Estamos fazendo melhorias no sistema. Voltará em breve!</p>
                      </div>
                    </CardContent>
                  </Card>
                  {/* <RealtimeChat 
                    colorTheme="sage"
                    showHeader={false}
                    className="h-auto lg:h-[calc(100vh-400px)] lg:min-h-[500px]"
                  /> */}
                </TabsContent>

              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Tuwi Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-accent-300">TUWI</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Tuwi. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

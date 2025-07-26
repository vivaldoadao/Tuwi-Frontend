"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"
import { getUserOrders, type Order } from "@/lib/orders"
import { getUserBookings, getBraiderById, type Booking, type Service } from "@/lib/data"
import { 
  User, 
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
  Package,
  Award,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Euro,
  LogOut,
  Plus,
  MessageSquare
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "+351 900 000 000",
    address: "Lisboa, Portugal",
    bio: "Apaixonada por tranças e cuidados capilares afro-brasileiros."
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else {
      setUserInfo({
        name: user.name || "",
        email: user.email || "",
        phone: "+351 900 000 000",
        address: "Lisboa, Portugal", 
        bio: "Apaixonada por tranças e cuidados capilares afro-brasileiros."
      })

      const fetchUserData = async () => {
        setLoadingOrders(true)
        const userOrders = await getUserOrders("user-1700000000000")
        setOrders(userOrders)
        setLoadingOrders(false)

        setLoadingBookings(true)
        const userBookings = await getUserBookings(user.email)
        setBookings(userBookings)
        setLoadingBookings(false)
      }
      fetchUserData()
    }
  }, [user, router])

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setIsEditing(false)
  }

  const handleLogout = () => {
    // In a real app, you would handle logout here
    router.push("/login")
  }

  if (!user) {
    return null
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

  const getOrderStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "entregue":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "processando":
        return <Activity className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "entregue":
        return "bg-green-100 text-green-700 border-green-200"
      case "pendente":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "processando":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  // Calculate user stats
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const totalBookings = bookings.length
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
                  <User className="h-12 w-12" />
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
              <div className="text-2xl font-bold">€{totalSpent.toFixed(0)}</div>
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
                    <User className="h-5 w-5" />
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
                    <span className="text-lg font-bold text-green-600">€{totalSpent.toFixed(2)}</span>
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

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Orders Section */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Meus Pedidos ({totalOrders})
                      </CardTitle>
                      <CardDescription>
                        Acompanhe o status dos seus pedidos
                      </CardDescription>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                      <Link href="/products">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Compra
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-24 bg-gray-200 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium text-lg mb-2">Nenhum pedido encontrado</p>
                      <p className="text-gray-400 text-sm mb-6">Você ainda não fez nenhuma compra</p>
                      <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                        <Link href="/products">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Começar a Comprar
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                Pedido #{order.id.split("-")[1]}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {order.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl text-purple-600 mb-1">€{order.total.toFixed(2)}</div>
                              <Badge variant="secondary" className={cn("text-xs", getOrderStatusBadgeClass(order.status))}>
                                <span className="flex items-center gap-1">
                                  {getOrderStatusIcon(order.status)}
                                  {order.status}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.productId} className="flex items-center gap-4 p-3 bg-white/80 rounded-xl">
                                <Image
                                  src={item.imageUrl || "/placeholder.svg?height=50&width=50"}
                                  alt={item.name}
                                  width={50}
                                  height={50}
                                  className="rounded-lg object-cover"
                                  unoptimized={true}
                                />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {item.quantity}x • €{item.price.toFixed(2)} cada
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">€{(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings Section */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Meus Agendamentos ({totalBookings})
                      </CardTitle>
                      <CardDescription>
                        Acompanhe seus agendamentos de serviços
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
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium text-lg mb-2">Nenhum agendamento encontrado</p>
                      <p className="text-gray-400 text-sm mb-6">Você ainda não agendou nenhum serviço</p>
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
                        const braider = getBraiderById(booking.braiderId)
                        const service = braider?.services.find((s: Service) => s.id === booking.serviceId)
                        return (
                          <div key={booking.id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Award className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg text-gray-900">
                                    {braider?.name || "Trancista Desconhecida"}
                                  </h4>
                                  <p className="text-sm text-gray-600">{service?.name || "Serviço Desconhecido"}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {booking.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {booking.time}
                                    </span>
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
                                  {booking.bookingType === "domicilio" ? "Serviço ao Domicílio" : "Na Casa da Trancista"}
                                </span>
                              </div>
                              {booking.bookingType === "domicilio" && booking.clientAddress && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {booking.clientAddress}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Phone className="h-3 w-3" />
                                {braider?.contactPhone || "N/A"}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
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

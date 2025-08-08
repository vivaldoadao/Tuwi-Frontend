"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Home, CheckCircle, XCircle, Calendar, Phone, Mail, Clock, Euro, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

interface Booking {
  id: string
  braiderId: string
  serviceId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress?: string
  date: string
  time: string
  bookingType: 'domicilio' | 'trancista'
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  createdAt: string
  service?: {
    name: string
    price: number
    durationMinutes: number
  }
}

interface Braider {
  id: string
  name: string
  contactEmail: string
  status: string
}

export default function BraiderBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [braider, setBraider] = useState<Braider | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      console.log('Current user object:', user)
      
      if (!user?.id) {
        console.log('No user ID found, redirecting to login')
        router.push('/login')
        return
      }

      setLoading(true)
      try {
        console.log('Fetching braider bookings via API...')
        console.log('User details:', { id: user.id, email: user.email, name: user.name, role: user.role })
        
        // Check if user has braider role
        if (user.role !== 'braider') {
          console.log('User role is not braider. Current role:', user.role)
        }
        
        // Fetch data via API to bypass RLS issues
        const response = await fetch('/api/braiders/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('API error:', result.error)
          if (result.needsRegistration) {
            console.log('User needs to be registered as braider')
            setLoading(false)
            return
          }
          throw new Error(result.error || 'Erro ao carregar dados')
        }

        console.log('API response:', result)

        if (result.success) {
          setBraider(result.braider)
          setBookings(result.bookings || [])
          setFilteredBookings(result.bookings || [])
          console.log('Data loaded successfully:', { 
            braider: result.braider.id, 
            bookingsCount: result.bookings?.length || 0 
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, router])

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = bookings

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(booking => booking.bookingType === typeFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, typeFilter])

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking["status"]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/braiders/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, status: newStatus })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b.id === bookingId ? { ...b, status: newStatus } : b
          )
        )
        console.log('Status atualizado com sucesso')
      } else {
        console.error("Erro ao atualizar status do agendamento:", result.error)
      }
    } catch (error) {
      console.error("Erro inesperado ao atualizar status:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: Booking["status"]) => {
    switch (status) {
      case "Confirmado":
        return "default"
      case "Pendente":
        return "secondary"
      case "Cancelado":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Analytics
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === "Pendente").length
  const confirmedBookings = bookings.filter(b => b.status === "Confirmado").length
  const cancelledBookings = bookings.filter(b => b.status === "Cancelado").length
  const totalRevenue = bookings
    .filter(b => b.status === "Confirmado")
    .reduce((sum, booking) => {
      return sum + (booking.service?.price || 0)
    }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  if (!braider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Esta página é exclusiva para trancistas registradas e aprovadas no sistema.
          </p>
          
          {user?.email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Email atual:</strong> {user.email}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Role: {user.role || 'customer'}
              </p>
            </div>
          )}

          <div className="space-y-3 text-sm text-gray-500">
            <p>• Verifique se você se registrou como trancista</p>
            <p>• Aguarde a aprovação do seu cadastro</p>
            <p>• Para testar, use um email de trancista mock</p>
            <p>• Entre em contato conosco se houver problemas</p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-3 mt-4 text-xs">
            <p className="font-semibold text-gray-700 mb-2">Emails de teste disponíveis:</p>
            <div className="grid grid-cols-1 gap-1 text-gray-600">
              <p>ana.trancista@example.com</p>
              <p>maria@example.com</p>
              <p>ana@example.com</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={() => router.push('/register-braider')}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white"
            >
              Registrar-se como Trancista
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">
              Gestão de Agendamentos 📅
            </h1>
            <p className="text-white/90 text-lg">
              Gerencie todos os seus agendamentos em um só lugar
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <div className="text-white/80">Total de agendamentos</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingBookings}</div>
                <div className="text-gray-600 font-medium">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{confirmedBookings}</div>
                <div className="text-gray-600 font-medium">Confirmados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{cancelledBookings}</div>
                <div className="text-gray-600 font-medium">Cancelados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Euro className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">€{totalRevenue}</div>
                <div className="text-gray-600 font-medium">Faturamento</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-gray-900">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="domicilio">Ao Domicílio</SelectItem>
                <SelectItem value="trancista">No Salão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading text-gray-900">
            {filteredBookings.length === 0 ? "Nenhum agendamento encontrado" : "Seus Agendamentos"}
          </h2>
          <Badge variant="secondary" className="bg-accent-100 text-accent-700 px-3 py-1">
            {filteredBookings.length} {filteredBookings.length === 1 ? "resultado" : "resultados"}
          </Badge>
        </div>

        {filteredBookings.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum agendamento encontrado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Nenhum agendamento corresponde aos filtros selecionados."
                  : "Você ainda não recebeu nenhum agendamento."}
              </p>
              {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setTypeFilter("all")
                  }}
                  className="bg-accent-500 hover:bg-accent-600 text-white rounded-xl"
                >
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            const service = booking.service
            return (
              <Card key={booking.id} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Left side - Main info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-accent-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">
                              {service?.name || "Serviço Desconhecido"}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{format(new Date(booking.date + "T" + booking.time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(booking.status)} className="text-sm px-3 py-1">
                          {booking.status}
                        </Badge>
                      </div>

                      {/* Client Info */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Informações do Cliente</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Image
                              src="/placeholder.svg?height=24&width=24&text=👤"
                              alt="Cliente"
                              width={16}
                              height={16}
                              unoptimized={true}
                            />
                            <span className="font-medium">{booking.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{booking.clientEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{booking.clientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {booking.bookingType === "domicilio" ? (
                              <Home className="h-4 w-4 text-accent-600" />
                            ) : (
                              <MapPin className="h-4 w-4 text-accent-600" />
                            )}
                            <span>{booking.bookingType === "domicilio" ? "Ao Domicílio" : "No Salão"}</span>
                          </div>
                        </div>
                        {booking.bookingType === "domicilio" && booking.clientAddress && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.clientAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Service Details */}
                      {service && (
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {service?.durationMinutes || 0} min
                            </span>
                            <span className="text-2xl font-bold text-accent-600">
                              €{service?.price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="w-48 bg-gray-50 p-6 flex flex-col justify-center">
                      <div className="space-y-3">
                        {booking.status === "Pendente" && (
                          <>
                            <Button
                              onClick={() => handleUpdateBookingStatus(booking.id, "Confirmado")}
                              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg"
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleUpdateBookingStatus(booking.id, "Cancelado")}
                              className="w-full rounded-xl"
                              disabled={loading}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {booking.status === "Confirmado" && (
                          <Button
                            variant="destructive"
                            onClick={() => handleUpdateBookingStatus(booking.id, "Cancelado")}
                            className="w-full rounded-xl"
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                        {booking.status === "Cancelado" && (
                          <div className="text-center text-gray-500 text-sm">
                            Agendamento cancelado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
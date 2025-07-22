"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { getUserOrders, type Order } from "@/lib/orders"
import { getUserBookings, getBraiderById, type Booking, type Service } from "@/lib/data" // Importar para agendamentos
import Image from "next/image"
import Link from "next/link"
import { MapPin, Home } from "lucide-react" // Ícones para tipo de agendamento
import { Badge } from "@/components/ui/badge" // Importar Badge

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<Booking[]>([]) // NOVO: Estado para agendamentos
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true) // NOVO: Estado de carregamento para agendamentos

  useEffect(() => {
    if (!user) {
      router.push("/login") // Redirect if not logged in
    } else {
      const fetchUserData = async () => {
        // Fetch Orders
        setLoadingOrders(true)
        // Use a dummy user ID for now, in a real app this would be user.id
        const userOrders = await getUserOrders("user-1700000000000") // Assuming a dummy user ID for now
        setOrders(userOrders)
        setLoadingOrders(false)

        // Fetch Bookings
        setLoadingBookings(true)
        // Use user.email to fetch bookings
        const userBookings = await getUserBookings(user.email)
        setBookings(userBookings)
        setLoadingBookings(false)
      }
      fetchUserData()
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) {
    return null // Or a loading spinner
  }

  const getBookingStatusBadgeVariant = (status: Booking["status"]) => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Meu Perfil</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* User Info Card */}
            <Card className="md:col-span-1 bg-white text-gray-900 shadow-lg rounded-lg p-6 space-y-4 h-fit">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl font-bold text-brand-primary">Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <p className="text-lg">
                  <span className="font-semibold">Nome:</span> {user.name}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
              </CardContent>
              <Button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg mt-6"
              >
                Sair
              </Button>
            </Card>

            {/* Orders and Bookings Sections */}
            <div className="md:col-span-2 space-y-8">
              {/* Orders Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-brand-primary">Minhas Encomendas</h2>
                {loadingOrders ? (
                  <p className="text-gray-700">Carregando encomendas...</p>
                ) : orders.length === 0 ? (
                  <Card className="bg-white text-gray-900 p-6 text-center shadow-lg rounded-lg">
                    <CardTitle className="text-xl mb-2 text-brand-primary">Nenhuma encomenda encontrada.</CardTitle>
                    <CardDescription className="text-gray-700">Você ainda não fez nenhuma compra.</CardDescription>
                    <Button
                      asChild
                      className="mt-4 bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white"
                    >
                      <Link href="/products">Comece a Comprar</Link>
                    </Button>
                  </Card>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
                      <CardHeader className="p-4 border-b border-gray-200">
                        <CardTitle className="text-xl font-bold text-brand-primary">
                          Encomenda #{order.id.split("-")[1]}
                        </CardTitle>
                        <CardDescription className="text-gray-700">
                          Data: {order.date} | Status: {order.status}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {order.items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-4">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="rounded-md object-cover"
                              unoptimized={true}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-700">
                                {item.quantity} x €{item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-bold text-brand-accent">€{(item.quantity * item.price).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-4">
                          <span className="text-lg font-bold">Total da Encomenda:</span>
                          <span className="text-2xl font-bold text-brand-accent">€{order.total.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* NOVO: Bookings Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-brand-primary">Meus Agendamentos</h2>
                {loadingBookings ? (
                  <p className="text-gray-700">Carregando agendamentos...</p>
                ) : bookings.length === 0 ? (
                  <Card className="bg-white text-gray-900 p-6 text-center shadow-lg rounded-lg">
                    <CardTitle className="text-xl mb-2 text-brand-primary">Nenhum agendamento encontrado.</CardTitle>
                    <CardDescription className="text-gray-700">Você ainda não agendou nenhum serviço.</CardDescription>
                    <Button
                      asChild
                      className="mt-4 bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white"
                    >
                      <Link href="/braiders">Encontre uma Trancista</Link>
                    </Button>
                  </Card>
                ) : (
                  bookings.map((booking) => {
                    const braider = getBraiderById(booking.braiderId)
                    const service = braider?.services.find((s: Service) => s.id === booking.serviceId)
                    return (
                      <Card key={booking.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
                        <CardHeader className="p-4 border-b border-gray-200">
                          <CardTitle className="text-xl font-bold text-brand-primary">
                            Agendamento com {braider?.name || "Trancista Desconhecida"}
                          </CardTitle>
                          <CardDescription className="text-gray-700">
                            Serviço: {service?.name || "Desconhecido"} | Data: {booking.date} às {booking.time}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            {booking.bookingType === "domicilio" ? (
                              <Home className="h-4 w-4 text-brand-accent" />
                            ) : (
                              <MapPin className="h-4 w-4 text-brand-accent" />
                            )}
                            Tipo: {booking.bookingType === "domicilio" ? "Ao Domicílio" : "Na Casa da Trancista"}
                          </div>
                          {booking.bookingType === "domicilio" && booking.clientAddress && (
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-brand-accent" />
                              Endereço: {booking.clientAddress}
                            </p>
                          )}
                          <p className="text-sm text-gray-700">
                            Telefone da Trancista: {braider?.contactPhone || "N/A"}
                          </p>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-4">
                            <span className="text-lg font-bold">Status:</span>
                            <Badge variant={getBookingStatusBadgeVariant(booking.status)} className="text-lg">
                              {booking.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
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

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBraiderBookings, getBraiderById, updateBookingStatus, type Booking, type Service } from "@/lib/data" // Importar updateBookingStatus
import { MapPin, Home, CheckCircle, XCircle } from "lucide-react" // Importar ícones para tipo de agendamento e ações
import { Button } from "@/components/ui/button" // Importar Button
import { Badge } from "@/components/ui/badge" // Importar Badge

export default function BraiderBookingsPage() {
  // Simular que o braider-1 está logado. Em um cenário real, isso viria da autenticação.
  const braiderId = "braider-1"
  const braider = getBraiderById(braiderId) // Obter os dados da trancista para pegar os serviços
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      const braiderBookings = await getBraiderBookings(braiderId)
      setBookings(braiderBookings)
      setLoading(false)
    }
    fetchBookings()
  }, [])

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking["status"]) => {
    setLoading(true)
    const result = await updateBookingStatus(bookingId, newStatus)
    if (result.success) {
      // Atualiza o estado local para refletir a mudança
      setBookings((prevBookings) => prevBookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
    } else {
      console.error("Erro ao atualizar status do agendamento:", result.message)
      // Poderia adicionar um toast ou mensagem de erro aqui
    }
    setLoading(false)
  }

  if (!braider) {
    return <p className="text-red-500">Erro: Dados da trancista não encontrados. Acesso negado.</p>
  }

  if (loading) {
    return <p className="text-gray-700">Carregando agendamentos...</p>
  }

  if (bookings.length === 0) {
    return (
      <Card className="bg-white text-gray-900 p-6 text-center shadow-lg rounded-lg">
        <CardTitle className="text-xl mb-2 text-brand-primary">Nenhum agendamento recebido.</CardTitle>
        <CardDescription className="text-gray-700">Parece que você ainda não tem agendamentos.</CardDescription>
      </Card>
    )
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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Meus Agendamentos Recebidos</h2>
      {bookings.map((booking) => {
        const service = braider.services.find((s: Service) => s.id === booking.serviceId)
        return (
          <Card key={booking.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-brand-primary">
                Agendamento para {service?.name || "Serviço Desconhecido"}
              </CardTitle>
              <CardDescription className="text-gray-700">
                Cliente: {booking.clientName} | Data: {booking.date} às {booking.time}
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
              <p className="text-sm text-gray-700">Email: {booking.clientEmail}</p>
              <p className="text-sm text-gray-700">Telefone: {booking.clientPhone}</p>
              {service && (
                <p className="text-sm text-gray-700">
                  Serviço: {service.name} (Duração: {service.durationMinutes} min, Preço: €{service.price.toFixed(2)})
                </p>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-4">
                <span className="text-lg font-bold">Status:</span>
                <Badge variant={getStatusBadgeVariant(booking.status)} className="text-lg">
                  {booking.status}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                {booking.status === "Pendente" && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(booking.id, "Confirmado")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceitar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(booking.id, "Cancelado")}
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
                    size="sm"
                    onClick={() => handleUpdateBookingStatus(booking.id, "Cancelado")}
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
                {/* Se o status for "Cancelado", não há botões de ação */}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

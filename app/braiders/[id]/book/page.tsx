"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react" // Adicionar useCallback
import { notFound, useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale" // Importar locale para o calendário
import { CalendarIcon } from "lucide-react" // Importar CalendarIcon
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Importar Popover
import { Calendar } from "@/components/ui/calendar" // Importar Calendar
import {
  addBooking,
  getBraiderById,
  getBraiderAvailabilities, // Importar nova função
  type Service,
  type BraiderAvailability, // Importar novo tipo
} from "@/lib/data"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function BookServicePage({ params }: { params: { id: string } }) {
  const braider = getBraiderById(params.id)
  const router = useRouter()

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | undefined>(undefined) // NOVO ESTADO: ID da disponibilidade selecionada
  const [availableTimes, setAvailableTimes] = useState<BraiderAvailability[]>([]) // NOVO ESTADO: Horários disponíveis
  const [bookingType, setBookingType] = useState<"domicilio" | "trancista" | undefined>(undefined)
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  if (!braider) {
    notFound()
  }

  // Função para buscar e atualizar os horários disponíveis
  const fetchAvailableTimes = useCallback(
    async (selectedDate: Date | undefined) => {
      if (!selectedDate) {
        setAvailableTimes([])
        setSelectedAvailabilityId(undefined) // Limpar seleção de horário
        return
      }
      setLoading(true)
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const availabilities = await getBraiderAvailabilities(braider.id, formattedDate)
      // Filtrar apenas os horários que não estão reservados
      const unbookedAvailabilities = availabilities.filter((avail) => !avail.isBooked)
      setAvailableTimes(unbookedAvailabilities)
      setSelectedAvailabilityId(undefined) // Resetar a seleção de horário ao mudar a data
      setLoading(false)
    },
    [braider.id],
  )

  // Efeito para buscar horários quando a data muda
  useEffect(() => {
    fetchAvailableTimes(date)
  }, [date, fetchAvailableTimes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (
      !selectedServiceId ||
      !date ||
      !selectedAvailabilityId || // Agora exigimos um slot de disponibilidade
      !bookingType ||
      !clientName ||
      !clientEmail ||
      !clientPhone
    ) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      return
    }

    if (bookingType === "domicilio" && !clientAddress) {
      setMessage({ type: "error", text: "Por favor, insira o endereço completo para agendamentos ao domicílio." })
      return
    }

    setLoading(true)
    const bookingDate = format(date, "yyyy-MM-dd")
    const selectedTimeSlot = availableTimes.find((avail) => avail.id === selectedAvailabilityId)

    if (!selectedTimeSlot) {
      setMessage({ type: "error", text: "Horário selecionado inválido." })
      setLoading(false)
      return
    }

    const result = await addBooking(
      {
        braiderId: braider.id,
        serviceId: selectedServiceId,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress: bookingType === "domicilio" ? clientAddress : undefined,
        date: bookingDate,
        time: selectedTimeSlot.startTime, // Usar a hora de início do slot
        bookingType,
      },
      selectedAvailabilityId, // Passar o ID da disponibilidade para marcar como reservado
    )

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      // Clear form
      setSelectedServiceId(undefined)
      setDate(undefined)
      setSelectedAvailabilityId(undefined)
      setAvailableTimes([]) // Limpar horários disponíveis
      setBookingType(undefined)
      setClientName("")
      setClientEmail("")
      setClientPhone("")
      setClientAddress("")
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  const selectedService = braider.services.find((s) => s.id === selectedServiceId)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">
            Agendar Serviço com {braider.name}
          </h1>
          <Card className="bg-white text-gray-900 shadow-lg rounded-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-brand-primary">Detalhes do Agendamento</CardTitle>
              <CardDescription className="text-gray-700">
                Preencha os detalhes para agendar seu serviço de trança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-6">
                {/* Service Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="service" className="text-gray-900">
                    Serviço
                  </Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger className="w-full bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {braider.services.map((service: Service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - €{service.price.toFixed(2)} ({service.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection with Calendar */}
                <div className="grid gap-2">
                  <Label htmlFor="date-picker" className="text-gray-900">
                    Data do Agendamento
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-100 border-gray-300 text-gray-900",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection based on Availability */}
                <div className="grid gap-2">
                  <Label htmlFor="time" className="text-gray-900">
                    Hora do Agendamento
                  </Label>
                  <Select
                    value={selectedAvailabilityId}
                    onValueChange={setSelectedAvailabilityId}
                    disabled={!date || loading} // Desabilitar se a data não estiver selecionada ou estiver carregando
                  >
                    <SelectTrigger className="w-full bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent">
                      <SelectValue placeholder={loading ? "Carregando horários..." : "Selecione um horário"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {availableTimes.length === 0 ? (
                        <SelectItem value="no-times" disabled>
                          Nenhum horário disponível para esta data.
                        </SelectItem>
                      ) : (
                        availableTimes.map((avail) => (
                          <SelectItem key={avail.id} value={avail.id}>
                            {avail.startTime} - {avail.endTime}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Type Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="bookingType" className="text-gray-900">
                    Tipo de Agendamento
                  </Label>
                  <Select
                    value={bookingType}
                    onValueChange={(value: "domicilio" | "trancista") => {
                      setBookingType(value)
                      if (value === "trancista") {
                        setClientAddress("")
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent">
                      <SelectValue placeholder="Selecione o tipo de agendamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="domicilio">Ao Domicílio</SelectItem>
                      <SelectItem value="trancista">Na Casa da Trancista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Address - Conditional */}
                {bookingType === "domicilio" && (
                  <div className="grid gap-2">
                    <Label htmlFor="clientAddress" className="text-gray-900">
                      Endereço Completo do Cliente
                    </Label>
                    <Input
                      id="clientAddress"
                      placeholder="Rua, Número, Bairro, Cidade, País"
                      required={bookingType === "domicilio"}
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                )}

                {/* Client Information */}
                <div className="grid gap-2">
                  <Label htmlFor="clientName" className="text-gray-900">
                    Seu Nome
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Seu nome completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clientEmail" className="text-gray-900">
                    Seu Email
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clientPhone" className="text-gray-900">
                    Seu Telefone
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="(XX) XXXXX-XXXX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>

                {message && (
                  <div
                    className={cn(
                      "p-3 rounded-md text-center",
                      message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {message.text}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
                  disabled={loading}
                >
                  {loading ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
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

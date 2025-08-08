"use client"

import type React from "react"

import { useEffect, useState, useCallback, use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { useNotificationHelpers } from "@/hooks/use-notification-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Home, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Star,
  Calendar as CalendarIconLarge
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  getBraiderById,
  getBraiderAvailability,
  addBooking,
  type Service,
  type BraiderAvailability,
  type Braider,
} from "@/lib/data-supabase"
import Image from "next/image"
import { cn } from "@/lib/utils"
import ServiceDetailModal from "@/components/service-detail-modal"

export default function BookServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { notifyBookingConfirmed } = useNotificationHelpers()
  
  // Estado da trancista
  const [braider, setBraider] = useState<Braider | null>(null)
  const [braiderLoading, setBraiderLoading] = useState(true)

  // Estados principais
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | undefined>(undefined)
  const [availableTimes, setAvailableTimes] = useState<BraiderAvailability[]>([])
  const [bookingType, setBookingType] = useState<"domicilio" | "trancista" | undefined>(undefined)
  
  // Estados do cliente
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  
  // Estados para modal e paginação
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const servicesPerPage = 8

  // Função para carregar datas disponíveis
  const loadAvailableDates = useCallback(async () => {
    if (!braider) return
    
    try {
      // Buscar todas as disponibilidades da trancista
      const allAvailabilities = await getBraiderAvailability(braider.id)
      
      // Filtrar apenas as não reservadas e criar Set de datas únicas
      const dates = new Set(
        allAvailabilities
          .filter(avail => !avail.isBooked)
          .map(avail => avail.date)
      )
      
      setAvailableDates(dates)
    } catch (error) {
      console.error('Erro ao carregar datas disponíveis:', error)
    }
  }, [braider])

  // Função para buscar horários disponíveis
  const fetchAvailableTimes = useCallback(
    async (selectedDate: Date | undefined) => {
      if (!selectedDate || !braider) {
        setAvailableTimes([])
        setSelectedAvailabilityId(undefined)
        return
      }
      setLoading(true)
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        // Para agora, usar os dados do mês/ano da data selecionada
        const selectedMonth = selectedDate.getMonth() + 1
        const selectedYear = selectedDate.getFullYear()
        const availabilities = await getBraiderAvailability(braider.id, selectedMonth, selectedYear)
        
        // Filtrar apenas para a data específica e não reservadas
        const unbookedAvailabilities = availabilities.filter((avail) => 
          !avail.isBooked && avail.date === formattedDate
        )
        setAvailableTimes(unbookedAvailabilities)
        setSelectedAvailabilityId(undefined)
      } catch (error) {
        console.error('Erro ao carregar horários:', error)
        setAvailableTimes([])
      } finally {
        setLoading(false)
      }
    },
    [braider],
  )

  // Carregar dados da trancista
  useEffect(() => {
    async function loadBraider() {
      try {
        setBraiderLoading(true)
        const braiderData = await getBraiderById(id)
        if (!braiderData) {
          notFound()
        }
        setBraider(braiderData)
      } catch (error) {
        console.error('Erro ao carregar trancista:', error)
        notFound()
      } finally {
        setBraiderLoading(false)
      }
    }
    
    if (id) {
      loadBraider()
    }
  }, [id])

  // Carregar datas disponíveis ao montar o componente
  useEffect(() => {
    loadAvailableDates()
  }, [loadAvailableDates])

  useEffect(() => {
    fetchAvailableTimes(date)
  }, [date, fetchAvailableTimes])

  if (braiderLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando agendamento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!braider) {
    notFound()
  }

  const selectedService = braider.services.find(s => s.id === selectedServiceId)
  const selectedTime = availableTimes.find(t => t.id === selectedAvailabilityId)
  
  // Mock rating data
  const rating = 4.8
  const reviewCount = 156

  // Função para verificar se uma data tem disponibilidade
  const hasAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availableDates.has(dateStr)
  }

  // Funções para modal e paginação
  const openServiceModal = (service: Service) => {
    setSelectedServiceForModal(service)
    setIsModalOpen(true)
  }

  const closeServiceModal = () => {
    setIsModalOpen(false)
    setSelectedServiceForModal(null)
  }

  const selectServiceFromModal = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    closeServiceModal()
  }

  // Cálculos de paginação
  const totalPages = Math.ceil((braider?.services?.length || 0) / servicesPerPage)
  const startIndex = (currentPage - 1) * servicesPerPage
  const endIndex = startIndex + servicesPerPage
  const currentServices = braider?.services?.slice(startIndex, endIndex) || []

  // Funções de navegação entre steps
  const nextStep = () => {
    if (currentStep === 1 && selectedServiceId) {
      setCurrentStep(2)
    } else if (currentStep === 2 && date && selectedAvailabilityId) {
      setCurrentStep(3)
    } else if (currentStep === 3 && bookingType) {
      setCurrentStep(4)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Função para verificar se pode avançar para próximo step
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedServiceId !== undefined
      case 2: return date !== undefined && selectedAvailabilityId !== undefined
      case 3: return bookingType !== undefined
      case 4: return clientName && clientEmail && clientPhone && (bookingType !== 'domicilio' || clientAddress)
      default: return false
    }
  }

  // Função para desabilitar datas indisponíveis
  const disabledDays = (date: Date) => {
    // Desabilitar datas passadas
    if (isBefore(date, startOfDay(new Date()))) {
      return true
    }
    
    // Desabilitar datas sem disponibilidade
    return !hasAvailability(date)
  }

  // Função para estilizar datas com disponibilidade
  const modifiers = {
    available: (date: Date) => hasAvailability(date) && !isBefore(date, startOfDay(new Date()))
  }

  const modifiersStyles = {
    available: {
      backgroundColor: '#10b981',
      color: 'white',
      borderRadius: '8px',
      fontWeight: 'bold'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)

    if (!canProceedToNext()) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      setIsSubmitting(false)
      return
    }

    if (!selectedServiceId || !date || !selectedAvailabilityId || !bookingType) {
      setMessage({ type: "error", text: "Informações de agendamento incompletas." })
      setIsSubmitting(false)
      return
    }

    const bookingDate = format(date, "yyyy-MM-dd")
    const selectedTimeSlot = availableTimes.find((avail) => avail.id === selectedAvailabilityId)

    if (!selectedTimeSlot) {
      setMessage({ type: "error", text: "Horário selecionado inválido." })
      setIsSubmitting(false)
      return
    }

    try {
      const result = await addBooking(
        {
          braiderId: braider.id,
          serviceId: selectedServiceId,
          clientName,
          clientEmail,
          clientPhone,
          clientAddress: bookingType === "domicilio" ? clientAddress : undefined,
          date: bookingDate,
          time: selectedTimeSlot.startTime,
          bookingType,
        },
        selectedAvailabilityId,
      )

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        
        // Trigger booking confirmation notification
        const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR })
        notifyBookingConfirmed(braider.name, formattedDate, selectedTimeSlot.startTime)
        
        setCurrentStep(5) // Step de confirmação
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao processar agendamento. Tente novamente." })
    }
    
    setIsSubmitting(false)
  }

  const steps = [
    { number: 1, title: "Serviço", description: "Escolha o serviço desejado" },
    { number: 2, title: "Data & Hora", description: "Selecione data e horário" },
    { number: 3, title: "Local", description: "Tipo de atendimento" },
    { number: 4, title: "Dados", description: "Suas informações" },
    { number: 5, title: "Confirmação", description: "Finalizar agendamento" }
  ]

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                Escolha o Serviço
              </h3>
              <p className="text-gray-600">Selecione o serviço que você deseja realizar</p>
            </div>
            
            {/* Services Grid with Pagination - 4 columns, compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {currentServices.map((service) => (
                <Card 
                  key={service.id}
                  className={cn(
                    "group cursor-pointer border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                    selectedServiceId === service.id 
                      ? "border-accent-500 bg-accent-50 shadow-md" 
                      : "border-gray-200 hover:border-accent-300"
                  )}
                >
                  <CardContent className="p-0">
                    {/* Service Image - Smaller */}
                    <div className="relative h-32 overflow-hidden rounded-t-xl">
                      <Image
                        src={service.imageUrl || "/placeholder.svg?height=150&width=300&text=Serviço"}
                        alt={service.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      
                      {/* Price Badge - Smaller */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-accent-500 text-white text-sm font-bold px-2 py-1">
                          €{service.price.toFixed(0)}
                        </Badge>
                      </div>
                      
                      {/* Selected Indicator */}
                      {selectedServiceId === service.id && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle className="h-5 w-5 text-accent-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Service Info - Compact */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-lg font-bold font-heading text-gray-900 mb-1 group-hover:text-accent-600 transition-colors line-clamp-1">
                          {service.name}
                        </h4>
                        <p className="text-gray-600 text-xs overflow-hidden leading-tight" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {service.description || "Serviço profissional"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">{service.durationMinutes}min</span>
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openServiceModal(service)
                          }}
                          className="flex-1 text-xs h-8"
                        >
                          Detalhes
                        </Button>
                        <Button
                          onClick={() => setSelectedServiceId(service.id)}
                          className={cn(
                            "flex-1 text-xs h-8",
                            selectedServiceId === service.id
                              ? "bg-accent-600 hover:bg-accent-700"
                              : "bg-accent-500 hover:bg-accent-600"
                          )}
                        >
                          {selectedServiceId === service.id ? "✓" : "Escolher"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-10 h-10",
                        currentPage === page && "bg-accent-500 hover:bg-accent-600"
                      )}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}

            {/* Services Summary */}
            <div className="text-center text-sm text-gray-500 mt-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, braider?.services?.length || 0)} de {braider?.services?.length || 0} serviços
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                Escolha Data e Horário
              </h3>
              <p className="text-gray-600">Selecione quando você gostaria de realizar o serviço</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIconLarge className="h-5 w-5" />
                  Selecione a Data
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                      <span>Indisponível</span>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={disabledDays}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    locale={ptBR}
                    className="rounded-lg border mx-auto"
                    showOutsideDays={false}
                    classNames={{
                      day_selected: "bg-accent-500 text-white hover:bg-accent-600 focus:bg-accent-600",
                      day_today: "bg-accent-100 text-accent-900 font-bold",
                    }}
                  />
                </div>
              </Card>

              {/* Available Times */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horários Disponíveis
                </h4>
                
                {!date ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIconLarge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Selecione uma data para ver os horários disponíveis</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mx-auto mb-4"></div>
                    <p className="text-sm">Carregando horários...</p>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">Nenhum horário disponível</p>
                    <p className="text-xs mt-2">
                      {date ? `para ${format(date, "dd 'de' MMMM", { locale: ptBR })}` : ""}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-3">
                      📅 {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {availableTimes.map((time) => (
                        <Button
                          key={time.id}
                          variant={selectedAvailabilityId === time.id ? "default" : "outline"}
                          className={cn(
                            "justify-between h-auto p-4 text-left",
                            selectedAvailabilityId === time.id
                              ? "bg-accent-500 hover:bg-accent-600 text-white border-accent-500"
                              : "hover:bg-accent-50 hover:border-accent-300 text-gray-700"
                          )}
                          onClick={() => setSelectedAvailabilityId(time.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4" />
                            <div>
                              <div className="font-semibold">
                                {time.startTime} - {time.endTime}
                              </div>
                              <div className="text-xs opacity-75">
                                {(() => {
                                  const [startHour] = time.startTime.split(':').map(Number)
                                  if (startHour < 12) return 'Manhã'
                                  if (startHour < 18) return 'Tarde'
                                  return 'Noite'
                                })()}
                              </div>
                            </div>
                          </div>
                          {selectedAvailabilityId === time.id && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                Local do Atendimento
              </h3>
              <p className="text-gray-600">Onde você gostaria de realizar o serviço?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className={cn(
                  "cursor-pointer border-2 transition-all duration-300 hover:shadow-lg",
                  bookingType === "trancista" 
                    ? "border-accent-500 bg-accent-50" 
                    : "border-gray-200 hover:border-accent-300"
                )}
                onClick={() => setBookingType("trancista")}
              >
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="h-8 w-8 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">No Salão</h4>
                  <p className="text-gray-600 mb-4">Vá até o local da trancista</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{braider.location}</span>
                  </div>
                  {bookingType === "trancista" && (
                    <CheckCircle className="h-6 w-6 text-accent-500 mx-auto mt-4" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer border-2 transition-all duration-300 hover:shadow-lg",
                  bookingType === "domicilio" 
                    ? "border-accent-500 bg-accent-50" 
                    : "border-gray-200 hover:border-accent-300"
                )}
                onClick={() => setBookingType("domicilio")}
              >
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Ao Domicílio</h4>
                  <p className="text-gray-600 mb-4">A trancista vai até você</p>
                  <Badge variant="secondary" className="bg-accent-100 text-accent-700">
                    Taxa adicional pode ser aplicada
                  </Badge>
                  {bookingType === "domicilio" && (
                    <CheckCircle className="h-6 w-6 text-accent-500 mx-auto mt-4" />
                  )}
                </CardContent>
              </Card>
            </div>

            {bookingType === "domicilio" && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <Label htmlFor="clientAddress" className="text-base font-semibold mb-4 block">
                    Endereço Completo
                  </Label>
                  <Input
                    id="clientAddress"
                    placeholder="Rua, Número, Bairro, Cidade, CEP"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="h-12 text-base"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                Suas Informações
              </h3>
              <p className="text-gray-600">Precisamos dos seus dados para confirmar o agendamento</p>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="clientName" className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="clientName"
                  placeholder="Seu nome completo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientEmail" className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientPhone" className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Resumo do agendamento */}
            <Card className="bg-accent-50 border-accent-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Resumo do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Serviço:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-semibold">
                    {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Horário:</span>
                  <span className="font-semibold">
                    {selectedTime ? `${selectedTime.startTime} - ${selectedTime.endTime}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Local:</span>
                  <span className="font-semibold">
                    {bookingType === "domicilio" ? "Ao Domicílio" : "No Salão"}
                  </span>
                </div>
                <hr className="border-accent-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-accent-600">€{selectedService?.price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold font-heading text-gray-900">
              Agendamento Confirmado!
            </h3>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Seu agendamento foi realizado com sucesso. Você receberá um email de confirmação em breve.
            </p>
            
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span>Trancista:</span>
                  <span className="font-semibold">{braider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Serviço:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-semibold">
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Horário:</span>
                  <span className="font-semibold">
                    {selectedTime ? `${selectedTime.startTime} - ${selectedTime.endTime}` : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                asChild
                className="bg-accent-500 hover:bg-accent-600 text-white"
              >
                <Link href={`/braiders/${braider.id}`}>Ver Perfil da Trancista</Link>
              </Button>
              <Button
                asChild
                variant="outline"
              >
                <Link href="/braiders">Buscar Outras Trancistas</Link>
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Link href={`/braiders/${braider.id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading">Agendar Serviço</h1>
              <p className="text-white/80">com {braider.name}</p>
            </div>
          </div>

          {/* Braider Quick Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-md">
            <CardContent className="flex items-center gap-4 p-4">
              <Image
                src={braider.profileImageUrl || "/placeholder.svg?height=60&width=60&text=Trancista"}
                alt={braider.name}
                width={60}
                height={60}
                className="rounded-full object-cover border-2 border-white/30"
                unoptimized={true}
              />
              <div className="flex-1">
                <h3 className="font-bold">{braider.name}</h3>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(rating) ? 'fill-accent-400 text-accent-400' : 'text-white/30'
                      }`}
                    />
                  ))}
                  <span className="text-xs ml-1">{rating} ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3" />
                  {braider.location}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Progress Steps */}
          {currentStep < 5 && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {steps.slice(0, 4).map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                          currentStep >= step.number
                            ? "bg-accent-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        {currentStep > step.number ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          step.number
                        )}
                      </div>
                      {index < 3 && (
                        <div
                          className={cn(
                            "w-16 h-1 mx-2 transition-all duration-300",
                            currentStep > step.number ? "bg-accent-500" : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  {steps.slice(0, 4).map((step) => (
                    <div key={step.number} className="text-center w-10">
                      <div className="font-medium">{step.title}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden">
            <CardContent className="p-8">
              {renderStep()}

              {/* Error/Success Messages */}
              {message && (
                <div
                  className={cn(
                    "mt-6 p-4 rounded-xl text-center font-medium",
                    message.type === "success" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-red-100 text-red-700 border border-red-200"
                  )}
                >
                  {message.text}
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 5 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={currentStep === 1}
                    className="px-6"
                  >
                    Voltar
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceedToNext()}
                      className="bg-accent-500 hover:bg-accent-600 text-white px-8"
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceedToNext() || isSubmitting}
                      className="bg-accent-500 hover:bg-accent-600 text-white px-8"
                    >
                      {isSubmitting ? "Processando..." : "Confirmar Agendamento"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceForModal}
        braiderName={braider?.name}
        braiderRating={rating}
        braiderReviews={reviewCount}
        isOpen={isModalOpen}
        onClose={closeServiceModal}
        onSelectService={selectServiceFromModal}
      />

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={40}
              height={40}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-2xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

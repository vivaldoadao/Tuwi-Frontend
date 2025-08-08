"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, PlusCircle, Trash2, Clock, CheckCircle, AlertCircle, Calendar as CalendarLarge, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { type BraiderAvailability } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export default function BraiderAvailabilityPage() {
  const { data: session, status } = useSession()

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [availabilities, setAvailabilities] = useState<BraiderAvailability[]>([])
  const [weekAvailabilities, setWeekAvailabilities] = useState<BraiderAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; availabilityId: string | null }>({
    show: false,
    availabilityId: null
  })

  const fetchAvailabilities = async (selectedDate: Date | undefined) => {
    if (!selectedDate || status === 'loading') return
    
    if (!session?.user?.email) {
      setMessage({ type: "error", text: "Sessão não encontrada. Faça login novamente." })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const email = encodeURIComponent(session.user.email)
      
      console.log('📅 Fetching availability for:', formattedDate)
      
      const response = await fetch(`/api/braiders/availability?email=${email}&date=${formattedDate}`)
      const result = await response.json()
      
      if (result.success) {
        setAvailabilities(result.data || [])
        console.log('✅ Availability loaded:', result.data?.length || 0, 'slots')
      } else {
        console.error('❌ Error fetching availability:', result.message)
        setMessage({ type: "error", text: result.message })
        setAvailabilities([])
      }
    } catch (error) {
      console.error('💥 Error fetching availability:', error)
      setMessage({ type: "error", text: "Erro ao carregar disponibilidade. Tente novamente." })
      setAvailabilities([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWeekAvailabilities = async (selectedDate: Date | undefined) => {
    if (!selectedDate || status === 'loading') return
    
    if (!session?.user?.email) return

    try {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
      
      const dateStart = format(weekStart, "yyyy-MM-dd")
      const dateEnd = format(weekEnd, "yyyy-MM-dd")
      const email = encodeURIComponent(session.user.email)
      
      console.log('📊 Fetching week availability:', dateStart, 'to', dateEnd)
      
      // Single API call for entire week (performance optimization)
      const response = await fetch(`/api/braiders/availability?email=${email}&dateStart=${dateStart}&dateEnd=${dateEnd}`)
      const result = await response.json()
      
      if (result.success) {
        setWeekAvailabilities(result.data || [])
        console.log('✅ Week availability loaded:', result.data?.length || 0, 'slots')
      } else {
        console.error('❌ Error fetching week availability:', result.message)
        setWeekAvailabilities([])
      }
    } catch (error) {
      console.error('💥 Error fetching week availability:', error)
      setWeekAvailabilities([])
    }
  }

  useEffect(() => {
    fetchAvailabilities(date)
    fetchWeekAvailabilities(date)
  }, [date])

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!date || !startTime || !endTime) {
      setMessage({ type: "error", text: "Por favor, selecione uma data e preencha os horários." })
      return
    }

    if (startTime >= endTime) {
      setMessage({ type: "error", text: "A hora de início deve ser anterior à hora de término." })
      return
    }

    if (!session?.user?.email) {
      setMessage({ type: "error", text: "Sessão não encontrada. Faça login novamente." })
      return
    }

    try {
      setIsAdding(true)
      
      const formattedDate = format(date, "yyyy-MM-dd")
      
      console.log('➕ Adding availability:', formattedDate, startTime, '-', endTime)
      
      const response = await fetch('/api/braiders/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          date: formattedDate,
          startTime,
          endTime,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        setStartTime("")
        setEndTime("")
        
        // Refresh both views
        fetchAvailabilities(date)
        fetchWeekAvailabilities(date)
        
        console.log('✅ Availability added successfully')
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error adding availability:', error)
      setMessage({ type: "error", text: "Erro ao adicionar horário. Tente novamente." })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteClick = (availabilityId: string) => {
    setDeleteModal({ show: true, availabilityId })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.availabilityId || !session?.user?.email) {
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      
      console.log('🗑️ Deleting availability:', deleteModal.availabilityId)
      
      const email = encodeURIComponent(session.user.email)
      const response = await fetch(`/api/braiders/availability?availabilityId=${deleteModal.availabilityId}&email=${email}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        
        // Refresh both views
        fetchAvailabilities(date)
        fetchWeekAvailabilities(date)
        
        console.log('✅ Availability deleted successfully')
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error deleting availability:', error)
      setMessage({ type: "error", text: "Erro ao remover horário. Tente novamente." })
    } finally {
      setLoading(false)
      setDeleteModal({ show: false, availabilityId: null })
    }
  }

  // Quick availability templates
  const timeTemplates = [
    { label: "Manhã", start: "08:00", end: "12:00" },
    { label: "Tarde", start: "14:00", end: "18:00" },
    { label: "Noite", start: "19:00", end: "22:00" },
    { label: "Dia Todo", start: "08:00", end: "18:00" },
  ]

  const applyTemplate = (template: { start: string; end: string }) => {
    setStartTime(template.start)
    setEndTime(template.end)
  }

  // Get week view data
  const getWeekDays = () => {
    if (!date) return []
    
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    return eachDayOfInterval({ 
      start: weekStart, 
      end: endOfWeek(date, { weekStartsOn: 1 })
    }).map(day => {
      const formattedDate = format(day, "yyyy-MM-dd")
      const dayAvailabilities = weekAvailabilities.filter(avail => avail.date === formattedDate)
      
      return {
        date: day,
        formattedDate,
        availabilities: dayAvailabilities,
        availableSlots: dayAvailabilities.filter(avail => !avail.isBooked).length,
        bookedSlots: dayAvailabilities.filter(avail => avail.isBooked).length,
      }
    })
  }

  const weekDays = getWeekDays()

  // Loading state for initial auth check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-700">Carregando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-red-500">Erro: Sessão não encontrada. Faça login novamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CalendarLarge className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-heading mb-2">
              Gestão de Disponibilidade ⏰
            </h1>
            <p className="text-white/90 text-lg">
              Defina quando você está disponível para receber agendamentos
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{availabilities.length}</div>
            <div className="text-white/80">Horários hoje</div>
          </div>
        </div>
      </div>

      {/* Week Overview */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <CalendarLarge className="h-5 w-5" />
            Visão Semanal
          </CardTitle>
          <CardDescription>
            {date && `Semana de ${format(startOfWeek(date, { weekStartsOn: 1 }), "dd MMM", { locale: ptBR })} a ${format(endOfWeek(date, { weekStartsOn: 1 }), "dd MMM yyyy", { locale: ptBR })}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => (
              <div 
                key={day.formattedDate}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                  format(day.date, "yyyy-MM-dd") === format(date || new Date(), "yyyy-MM-dd")
                    ? "border-accent-500 bg-accent-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                )}
                onClick={() => setDate(day.date)}
              >
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {format(day.date, "EEE", { locale: ptBR })}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {format(day.date, "dd")}
                  </div>
                  <div className="space-y-1">
                    {day.availableSlots > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        {day.availableSlots} livre{day.availableSlots !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {day.bookedSlots > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                        {day.bookedSlots} ocupado{day.bookedSlots !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {day.availabilities.length === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Sem horários
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Add Availability Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Adicionar Horário
            </CardTitle>
            <CardDescription>
              Defina um novo período de disponibilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Picker */}
            <div className="space-y-3">
              <Label htmlFor="date-picker" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 bg-gray-50 border-gray-200 rounded-xl",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={setDate} 
                    initialFocus 
                    locale={ptBR}
                    disabled={(date) => date < new Date()} 
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Templates */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900">Modelos Rápidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {timeTemplates.map((template) => (
                  <Button
                    key={template.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-xs rounded-xl hover:bg-accent-50 hover:border-accent-300"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="startTime" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Início
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="endTime" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fim
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                />
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={cn(
                  "p-4 rounded-xl text-center font-medium",
                  message.type === "success" 
                    ? "bg-green-100 text-green-700 border border-green-200" 
                    : "bg-red-100 text-red-700 border border-red-200"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {message.text}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleAddAvailability}
              className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 rounded-xl shadow-lg"
              disabled={isAdding}
            >
              {isAdding ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Adicionando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Horário
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Availabilities */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários do Dia
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAvailabilities(date)}
                className="rounded-xl"
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <CardDescription className="text-lg">
                {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
              </CardDescription>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : availabilities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum horário disponível</p>
                <p className="text-sm mt-2">
                  {date ? `para ${format(date, "dd 'de' MMMM", { locale: ptBR })}` : ""}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availabilities.map((avail) => (
                  <Card
                    key={avail.id}
                    className={cn(
                      "border-2 transition-all duration-300 hover:shadow-md",
                      avail.isBooked 
                        ? "bg-red-50 border-red-200" 
                        : "bg-green-50 border-green-200 hover:bg-green-100"
                    )}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          avail.isBooked ? "bg-red-500" : "bg-green-500"
                        )}>
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {avail.startTime} - {avail.endTime}
                          </p>
                          <p className="text-sm">
                            <span className={cn(
                              "font-medium",
                              avail.isBooked ? "text-red-700" : "text-green-700"
                            )}>
                              {avail.isBooked ? "🔴 Reservado" : "🟢 Disponível"}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      {!avail.isBooked && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteClick(avail.id)}
                          disabled={loading}
                          className="rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Remover Horário
              </h3>
              <p className="text-gray-600 mb-4">
                Tem certeza que deseja remover este horário de disponibilidade?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModal({ show: false, availabilityId: null })}
                  disabled={loading}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 rounded-xl"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Remover'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import {
  addBraiderAvailability,
  getBraiderAvailabilities,
  deleteBraiderAvailability,
  type BraiderAvailability,
} from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export default function BraiderAvailabilityPage() {
  const braiderId = "braider-1"

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [availabilities, setAvailabilities] = useState<BraiderAvailability[]>([])
  const [weekAvailabilities, setWeekAvailabilities] = useState<BraiderAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchAvailabilities = async (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setAvailabilities([])
      return
    }
    setLoading(true)
    setMessage(null)
    const formattedDate = format(selectedDate, "yyyy-MM-dd")
    const fetchedAvailabilities = await getBraiderAvailabilities(braiderId, formattedDate)
    setAvailabilities(fetchedAvailabilities)
    setLoading(false)
  }

  const fetchWeekAvailabilities = async (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setWeekAvailabilities([])
      return
    }
    
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }) // Sunday
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    const allWeekAvailabilities = []
    for (const day of weekDays) {
      const formattedDate = format(day, "yyyy-MM-dd")
      const dayAvailabilities = await getBraiderAvailabilities(braiderId, formattedDate)
      allWeekAvailabilities.push(...dayAvailabilities)
    }
    
    setWeekAvailabilities(allWeekAvailabilities)
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

    setIsAdding(true)
    const formattedDate = format(date, "yyyy-MM-dd")
    const result = await addBraiderAvailability({
      braiderId,
      date: formattedDate,
      startTime,
      endTime,
    })

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      setStartTime("")
      setEndTime("")
      fetchAvailabilities(date)
      fetchWeekAvailabilities(date)
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setIsAdding(false)
  }

  const handleDeleteAvailability = async (availabilityId: string) => {
    setLoading(true)
    setMessage(null)
    const result = await deleteBraiderAvailability(availabilityId)
    if (result.success) {
      setMessage({ type: "success", text: result.message })
      fetchAvailabilities(date)
      fetchWeekAvailabilities(date)
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
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
                          onClick={() => handleDeleteAvailability(avail.id)}
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
    </div>
  )
}
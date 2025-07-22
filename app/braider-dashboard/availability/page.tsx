"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  addBraiderAvailability,
  getBraiderAvailabilities,
  deleteBraiderAvailability,
  type BraiderAvailability,
} from "@/lib/data"

export default function BraiderAvailabilityPage() {
  // Simular que o braider-1 está logado
  const braiderId = "braider-1"

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [availabilities, setAvailabilities] = useState<BraiderAvailability[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchAvailabilities(date)
  }, [date]) // Refetch when date changes

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

    setLoading(true)
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
      fetchAvailabilities(date) // Refresh list
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  const handleDeleteAvailability = async (availabilityId: string) => {
    setLoading(true)
    setMessage(null)
    const result = await deleteBraiderAvailability(availabilityId)
    if (result.success) {
      setMessage({ type: "success", text: result.message })
      fetchAvailabilities(date) // Refresh list
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Minha Disponibilidade</h2>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-bold text-brand-primary">Gerenciar Horários</CardTitle>
          <CardDescription className="text-gray-700">
            Defina os dias e horários em que você está disponível para agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 grid md:grid-cols-2 gap-8">
          {/* Calendar and Add Availability Form */}
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="date-picker" className="text-gray-900">
                Selecione a Data
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

            <form onSubmit={handleAddAvailability} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime" className="text-gray-900">
                    Hora de Início
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime" className="text-gray-900">
                    Hora de Término
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
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
                className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white"
                disabled={loading}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {loading ? "Adicionando..." : "Adicionar Disponibilidade"}
              </Button>
            </form>
          </div>

          {/* Existing Availabilities List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-brand-primary">
              Horários Disponíveis em {date ? format(date, "PPP", { locale: ptBR }) : "N/A"}
            </h3>
            {loading ? (
              <p className="text-gray-700">Carregando horários...</p>
            ) : availabilities.length === 0 ? (
              <p className="text-gray-600">Nenhum horário disponível para esta data.</p>
            ) : (
              <div className="grid gap-3">
                {availabilities.map((avail) => (
                  <Card
                    key={avail.id}
                    className={cn(
                      "flex items-center justify-between p-3 shadow-sm",
                      avail.isBooked ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200",
                    )}
                  >
                    <div>
                      <p className="font-semibold text-lg">
                        {avail.startTime} - {avail.endTime}
                      </p>
                      <p className="text-sm text-gray-700">
                        Status:{" "}
                        <span className={cn("font-medium", avail.isBooked ? "text-red-700" : "text-green-700")}>
                          {avail.isBooked ? "Reservado" : "Disponível"}
                        </span>
                      </p>
                    </div>
                    {!avail.isBooked && ( // Só permite deletar se não estiver reservado
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteAvailability(avail.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getBraiderById, type Braider, type Service } from "@/lib/data"
import { Plus, Edit3, Trash2, Briefcase, Clock, Euro, Save, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NewService {
  name: string
  description: string
  price: number
  durationMinutes: number
}

export default function BraiderServicesPage() {
  const braiderId = "braider-1"
  const braider = getBraiderById(braiderId)
  
  const [services, setServices] = useState<Service[]>(braider?.services || [])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [newService, setNewService] = useState<NewService>({
    name: "",
    description: "",
    price: 0,
    durationMinutes: 60
  })


  const handleAddService = async () => {
    if (!newService.name.trim() || newService.price <= 0) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      return
    }

    setLoading(true)
    
    // Simulate API call
    const serviceToAdd: Service = {
      id: `service-${Date.now()}`,
      name: newService.name,
      description: newService.description,
      price: newService.price,
      durationMinutes: newService.durationMinutes,
      imageUrl: "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(newService.name)
    }

    setServices(prev => [...prev, serviceToAdd])
    setNewService({
      name: "",
      description: "",
      price: 0,
      durationMinutes: 60
    })
    setIsAdding(false)
    setMessage({ type: "success", text: "Serviço adicionado com sucesso!" })
    setLoading(false)
  }

  const handleDeleteService = async (serviceId: string) => {
    setLoading(true)
    setServices(prev => prev.filter(s => s.id !== serviceId))
    setMessage({ type: "success", text: "Serviço removido com sucesso!" })
    setLoading(false)
  }

  const totalServices = services.length
  const activeServices = services.length // All services are active in this example
  const averagePrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0)

  if (!braider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Erro: Dados da trancista não encontrados. Acesso negado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-heading mb-2">
              Gestão de Serviços 💼
            </h1>
            <p className="text-white/90 text-lg">
              Gerencie todos os serviços que você oferece
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalServices}</div>
            <div className="text-white/80">Serviços ativos</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalServices}</div>
                <div className="text-gray-600 font-medium">Total Serviços</div>
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
                <div className="text-2xl font-bold text-gray-900">{activeServices}</div>
                <div className="text-gray-600 font-medium">Ativos</div>
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
                <div className="text-2xl font-bold text-gray-900">€{averagePrice.toFixed(0)}</div>
                <div className="text-gray-600 font-medium">Preço Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(totalDuration / 60)}h</div>
                <div className="text-gray-600 font-medium">Tempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add New Service Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {isAdding ? "Novo Serviço" : "Adicionar Serviço"}
            </CardTitle>
            <CardDescription>
              {isAdding ? "Preencha os dados do novo serviço" : "Expanda sua oferta de serviços"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAdding ? (
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 rounded-xl shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Serviço
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    Nome do Serviço
                  </Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                    placeholder="Ex: Tranças Nagô"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px] bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 resize-none"
                    placeholder="Descreva o serviço..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold text-gray-900">
                      Preço (€)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-semibold text-gray-900">
                      Duração (min)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={newService.durationMinutes}
                      onChange={(e) => setNewService(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                      className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </div>


                <div className="flex gap-2">
                  <Button
                    onClick={handleAddService}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setNewService({
                        name: "",
                        description: "",
                        price: 0,
                        durationMinutes: 60
                      })
                    }}
                    className="px-3 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-heading text-gray-900">
              Meus Serviços ({services.length})
            </h2>
          </div>

          {loading && services.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
              <CardContent className="text-center py-16">
                <Briefcase className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum serviço cadastrado</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Comece adicionando os serviços que você oferece para que os clientes possam fazer agendamentos.
                </p>
                <Button
                  onClick={() => setIsAdding(true)}
                  className="bg-accent-500 hover:bg-accent-600 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Image */}
                      <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
                        <Image
                          src={service.imageUrl || "/placeholder.svg?height=128&width=128&text=S"}
                          alt={service.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">
                              {service.name}
                            </h3>
                            <Badge variant="secondary" className="mb-2">
                              Serviço de Tranças
                            </Badge>
                            <p className="text-gray-600 text-sm mb-3">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} min
                            </span>
                            <span className="text-2xl font-bold text-accent-600">
                              €{service.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(service.id)}
                              className="rounded-xl"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              disabled={loading}
                              className="rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
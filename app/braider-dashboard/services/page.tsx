"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit3, Trash2, Briefcase, Clock, Euro, Save, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  description: string
  price: number
  durationMinutes: number
  imageUrl?: string
  isAvailable: boolean
}

interface NewService {
  name: string
  description: string
  price: number
  durationMinutes: number
}

export default function BraiderServicesPage() {
  const { data: session, status } = useSession()
  const [services, setServices] = useState<Service[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalServices, setTotalServices] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const servicesPerPage = 3
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; service: Service | null }>({
    show: false,
    service: null
  })
  
  // Edit service state
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [newService, setNewService] = useState<NewService>({
    name: "",
    description: "",
    price: 0,
    durationMinutes: 60
  })

  // Load services from database with pagination
  useEffect(() => {
    async function fetchServices() {
      if (status === 'loading') return
      
      if (!session?.user?.email) {
        setMessage({ type: "error", text: "Sessão não encontrada. Faça login novamente." })
        setInitialLoading(false)
        return
      }

      try {
        console.log('🚀 Fetching services from API with pagination...')
        console.log('📧 User email:', session.user.email)
        console.log('📄 Current page:', currentPage)
        console.log('📊 Services per page:', servicesPerPage)
        
        const email = encodeURIComponent(session.user.email || '')
        const apiUrl = `/api/braiders/services?email=${email}&page=${currentPage}&limit=${servicesPerPage}`
        console.log('🔗 API URL:', apiUrl)
        
        const response = await fetch(apiUrl)
        const result = await response.json()
        console.log('📦 API Response:', result)
        
        if (result.success && result.data) {
          setServices(result.data.services || [])
          setTotalPages(result.data.pagination.totalPages)
          setTotalServices(result.data.pagination.total)
          setHasNext(result.data.pagination.hasNext)
          setHasPrev(result.data.pagination.hasPrev)
          console.log('✅ Services loaded:', result.data.services.length, 'of', result.data.pagination.total)
          console.log('📄 Pagination state:', {
            totalPages: result.data.pagination.totalPages,
            currentPage,
            hasNext: result.data.pagination.hasNext,
            hasPrev: result.data.pagination.hasPrev
          })
        } else {
          console.log('ℹ️ No services found or braider not found')
          setServices([])
          setTotalServices(0)
          setTotalPages(1)
          setHasNext(false)
          setHasPrev(false)
        }
      } catch (error) {
        console.error('❌ Error fetching services:', error)
        setMessage({ type: "error", text: "Erro ao carregar serviços. Tente novamente." })
      } finally {
        setInitialLoading(false)
      }
    }

    fetchServices()
  }, [session, status, currentPage])

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setMessage({ type: "error", text: "Arquivo muito grande. Máximo 5MB." })
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload image for new service
  const uploadServiceImage = async (serviceId: string): Promise<string | null> => {
    if (!selectedImage || !session?.user?.email) return null

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('email', session.user.email)
      formData.append('serviceId', serviceId)

      const response = await fetch('/api/upload-service-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Service image uploaded:', result.imageUrl)
        return result.imageUrl
      } else {
        console.error('❌ Error uploading image:', result.message)
        setMessage({ type: "error", text: "Erro no upload da imagem: " + result.message })
        return null
      }
    } catch (error) {
      console.error('❌ Error uploading service image:', error)
      setMessage({ type: "error", text: "Erro no upload da imagem. Tente novamente." })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddService = async () => {
    if (!newService.name.trim() || newService.price <= 0) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      return
    }

    if (!session?.user?.email) {
      setMessage({ type: "error", text: "Sessão não encontrada. Faça login novamente." })
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      console.log('🚀 Creating new service via API...')
      
      const response = await fetch('/api/braiders/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          name: newService.name,
          description: newService.description,
          price: newService.price,
          durationMinutes: newService.durationMinutes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Service created successfully')
        
        // Upload image if selected
        if (selectedImage) {
          console.log('📤 Uploading service image...')
          const imageUrl = await uploadServiceImage(result.data.id)
          if (imageUrl) {
            console.log('✅ Service image uploaded successfully')
          }
        }
        
        // Reset form
        setNewService({
          name: "",
          description: "",
          price: 0,
          durationMinutes: 60
        })
        setSelectedImage(null)
        setImagePreview(null)
        setIsAdding(false)
        setMessage({ type: "success", text: result.message })
        
        // Refresh services list (will trigger useEffect with current page)
        const email = encodeURIComponent(session.user.email || '')
        const response = await fetch(`/api/braiders/services?email=${email}&page=${currentPage}&limit=${servicesPerPage}`)
        const refreshResult = await response.json()
        
        if (refreshResult.success && refreshResult.data) {
          setServices(refreshResult.data.services || [])
          setTotalPages(refreshResult.data.pagination.totalPages)
          setTotalServices(refreshResult.data.pagination.total)
          setHasNext(refreshResult.data.pagination.hasNext)
          setHasPrev(refreshResult.data.pagination.hasPrev)
        }
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error creating service:', error)
      setMessage({ type: "error", text: "Erro ao criar serviço. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (service: Service) => {
    setDeleteModal({ show: true, service })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.service || !session?.user?.email) {
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      console.log('🗑️ Deleting service via API...')
      
      const response = await fetch(`/api/braiders/services?serviceId=${deleteModal.service.id}&email=${encodeURIComponent(session.user.email)}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        console.log('✅ Service deleted successfully')
        
        // Check if we need to go back a page (if current page becomes empty)
        const shouldGoBack = services.length === 1 && currentPage > 1
        const targetPage = shouldGoBack ? currentPage - 1 : currentPage
        
        // Refresh services list
        const email = encodeURIComponent(session.user.email || '')
        const response = await fetch(`/api/braiders/services?email=${email}&page=${targetPage}&limit=${servicesPerPage}`)
        const refreshResult = await response.json()
        
        if (refreshResult.success && refreshResult.data) {
          setServices(refreshResult.data.services || [])
          setTotalPages(refreshResult.data.pagination.totalPages)
          setTotalServices(refreshResult.data.pagination.total)
          setHasNext(refreshResult.data.pagination.hasNext)
          setHasPrev(refreshResult.data.pagination.hasPrev)
          
          if (shouldGoBack) {
            setCurrentPage(targetPage)
          }
        }
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error deleting service:', error)
      setMessage({ type: "error", text: "Erro ao remover serviço. Tente novamente." })
    } finally {
      setLoading(false)
      setDeleteModal({ show: false, service: null })
    }
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
  }

  const handleUpdateService = async () => {
    if (!editingService || !session?.user?.email) {
      return
    }

    if (!editingService.name.trim() || editingService.price <= 0) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      console.log('✏️ Updating service via API...')
      
      const response = await fetch('/api/braiders/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: editingService.id,
          email: session.user.email,
          name: editingService.name,
          description: editingService.description,
          price: editingService.price,
          durationMinutes: editingService.durationMinutes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEditingService(null)
        setMessage({ type: "success", text: result.message })
        console.log('✅ Service updated successfully')
        
        // Refresh services list to get updated data
        const email = encodeURIComponent(session.user.email || '')
        const response = await fetch(`/api/braiders/services?email=${email}&page=${currentPage}&limit=${servicesPerPage}`)
        const refreshResult = await response.json()
        
        if (refreshResult.success && refreshResult.data) {
          setServices(refreshResult.data.services || [])
          setTotalPages(refreshResult.data.pagination.totalPages)
          setTotalServices(refreshResult.data.pagination.total)
          setHasNext(refreshResult.data.pagination.hasNext)
          setHasPrev(refreshResult.data.pagination.hasPrev)
        }
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error updating service:', error)
      setMessage({ type: "error", text: "Erro ao atualizar serviço. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  const activeServices = services.filter(s => s.isAvailable).length
  const averagePrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0)

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-700">Carregando serviços...</p>
        </div>
      </div>
    )
  }

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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Imagem do Serviço (opcional)
                  </Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-accent-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="service-image" className="cursor-pointer">
                        <div className="text-center py-4">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Clique para enviar uma imagem
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG ou WebP (máx. 5MB)
                          </p>
                        </div>
                        <input
                          id="service-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddService}
                    disabled={loading || uploadingImage}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                  >
                    {loading || uploadingImage ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm">
                          {uploadingImage ? "Enviando..." : "Salvando..."}
                        </span>
                      </div>
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
                      setSelectedImage(null)
                      setImagePreview(null)
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
              Meus Serviços ({totalServices})
            </h2>
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} 
              {totalPages > 1 && (
                <span className="ml-2 text-accent-600 font-medium">
                  • Paginação ativa
                </span>
              )}
            </div>
          </div>

          {initialLoading ? (
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
                        {service.imageUrl && service.imageUrl !== '/placeholder.svg' ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Image load error:', service.name, service.imageUrl)
                              e.currentTarget.src = "/placeholder.svg?height=128&width=128&text=S"
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', service.name, service.imageUrl)
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
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
                              onClick={() => handleEditClick(service)}
                              disabled={loading}
                              className="rounded-xl"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(service)}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrev || loading}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber: number
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      disabled={loading}
                      className={cn(
                        "w-8 h-8 rounded-xl",
                        pageNumber === currentPage 
                          ? "bg-accent-500 text-white hover:bg-accent-600" 
                          : ""
                      )}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={!hasNext || loading}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.service && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Remover Serviço
              </h3>
              <p className="text-gray-600 mb-2">
                Tem certeza que deseja remover o serviço:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                "{deleteModal.service.name}"?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModal({ show: false, service: null })}
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

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Editar Serviço
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingService(null)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-900">
                  Nome do Serviço
                </Label>
                <Input
                  id="edit-name"
                  value={editingService.name}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  placeholder="Ex: Tranças Nagô"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-900">
                  Descrição
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingService.description}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="min-h-[80px] bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 resize-none"
                  placeholder="Descreva o serviço..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-sm font-semibold text-gray-900">
                    Preço (€)
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-duration" className="text-sm font-semibold text-gray-900">
                    Duração (min)
                  </Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, durationMinutes: parseInt(e.target.value) || 60 } : null)}
                    className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingService(null)}
                  disabled={loading}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateService}
                  disabled={loading || !editingService.name.trim() || editingService.price <= 0}
                  className="flex-1 bg-accent-500 hover:bg-accent-600 text-white rounded-xl"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
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
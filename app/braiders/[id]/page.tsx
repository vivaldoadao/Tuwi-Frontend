"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBraiderById } from "@/lib/data-supabase"
import { useFavorites } from "@/context/favorites-context"
import { MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Star, Calendar, Heart, Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { Braider, Service } from "@/lib/data"
import ServiceDetailModal from "@/components/service-detail-modal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function BraiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [braider, setBraider] = useState<Braider | null>(null)
  const [loading, setLoading] = useState(true)
  const { isFavoriteBraider, toggleFavoriteBraider } = useFavorites()
  const [currentPortfolioImageIndex, setCurrentPortfolioImageIndex] = useState(0)
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const servicesPerPage = 8
  const { user } = useAuth()
  const router = useRouter()
  
  console.log('BraiderDetailPage - Received ID:', id)
  
  const isLiked = isFavoriteBraider(braider?.id || "")

  // Load braider data from database
  useEffect(() => {
    async function loadBraider() {
      try {
        setLoading(true)
        console.log('Loading braider with ID:', id)
        const braiderData = await getBraiderById(id)
        console.log('getBraiderById result:', braiderData)
        setBraider(braiderData)
        if (!braiderData) {
          console.log('No braider data found, calling notFound()')
          notFound()
        }
      } catch (error) {
        console.error('Error loading braider:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      loadBraider()
    } else {
      console.log('No ID provided')
      notFound()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!braider) {
    notFound()
  }

  const hasMultiplePortfolioImages = braider.portfolioImages && braider.portfolioImages.length > 1

  const handleNextPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prevIndex) => (prevIndex + 1) % braider.portfolioImages.length)
  }

  const handlePrevPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prevIndex) => (prevIndex === 0 ? braider.portfolioImages.length - 1 : prevIndex - 1))
  }

  // Service modal handlers
  const handleServiceClick = (service: Service) => {
    setSelectedServiceForModal(service)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedServiceForModal(null)
    setIsModalOpen(false)
  }

  const handleSelectService = (service: Service) => {
    // Here you could add logic to pre-select this service when navigating to booking page
    window.location.href = `/braiders/${braider?.id}/book?service=${service.id}`
  }

  const handleSelectServiceModal = (serviceId: string) => {
    // Handler for modal - expects just the service ID
    window.location.href = `/braiders/${braider?.id}/book?service=${serviceId}`
  }

  // Pagination calculations
  const totalPages = Math.ceil((braider?.services.length || 0) / servicesPerPage)
  const startIndex = (currentPage - 1) * servicesPerPage
  const endIndex = startIndex + servicesPerPage
  const currentServices = braider?.services.slice(startIndex, endIndex) || []

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }


  // Mock data for enhanced features
  const rating = 4.8
  const reviewCount = 156
  const completedServices = 234
  const responseTime = "~2h"

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Modern Hero Section with Back Button */}
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
              <Link href="/braiders">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold font-heading">Perfil da Trancista</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Profile Header Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {/* Cover Background */}
                <div className="h-32 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600"></div>
                
                {/* Profile Info */}
                <div className="relative px-6 pb-6 -mt-16">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Profile Image */}
                    <div className="relative">
                      <Image
                        src={braider.profileImageUrl || "/placeholder.svg?height=150&width=150&text=Trancista"}
                        alt={braider.name}
                        width={150}
                        height={150}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        unoptimized={true}
                      />
                      <Badge 
                        className={`absolute -bottom-2 -right-2 px-3 py-1 text-xs font-semibold ${
                          braider.status === 'approved' 
                            ? 'bg-green-500 hover:bg-green-500 text-white' 
                            : 'bg-yellow-500 hover:bg-yellow-500 text-white'
                        }`}
                      >
                        {braider.status === 'approved' ? 'Verificada' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    {/* Name and Basic Info */}
                    <div className="flex-1 text-center md:text-left space-y-3">
                      <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900">{braider.name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(rating) 
                                    ? 'fill-accent-500 text-accent-500' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {rating} ({reviewCount} avaliações)
                          </span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {braider.freguesia && braider.concelho && braider.district
                              ? `${braider.freguesia}, ${braider.concelho}, ${braider.district}`
                              : braider.concelho && braider.district
                              ? `${braider.concelho}, ${braider.district}`
                              : braider.district
                              ? braider.district
                              : braider.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavoriteBraider(braider.id)}
                        className={`rounded-full ${isLiked ? 'text-pink-500 border-pink-500 bg-pink-50' : 'hover:text-pink-500'}`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Main Action Buttons */}
                    <div className="flex flex-col gap-3 mt-4">
                      {/* Primary Actions */}
                      <div className="flex gap-3">
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Link href={`/braiders/${braider.id}/book`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar Serviço
                          </Link>
                        </Button>
                      </div>
                      
                      {/* Secondary Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => toggleFavoriteBraider(braider.id)}
                          variant="outline"
                          className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                            isLiked 
                              ? 'bg-pink-50 border-pink-300 text-pink-600 hover:bg-pink-100' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                          {isLiked ? 'Nos Favoritos' : 'Adicionar aos Favoritos'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 text-center p-6">
              <div className="text-3xl font-bold text-accent-600 mb-2">{completedServices}</div>
              <div className="text-sm text-gray-600">Serviços Realizados</div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 text-center p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{responseTime}</div>
              <div className="text-sm text-gray-600">Tempo de Resposta</div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 text-center p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{braider.services.length}</div>
              <div className="text-sm text-gray-600">Serviços Disponíveis</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* About Section */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6">Sobre</h3>
                <p className="text-gray-700 leading-relaxed mb-6">{braider.bio}</p>
                
                <div className="space-y-6">
                  {/* Location Details */}
                  {(braider.district || braider.concelho || braider.freguesia) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Localização</h4>
                      <div className="space-y-2">
                        {braider.district && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                              📍 {braider.district}
                            </Badge>
                          </div>
                        )}
                        {braider.concelho && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                              🏘️ {braider.concelho}
                            </Badge>
                          </div>
                        )}
                        {braider.freguesia && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                              🏡 {braider.freguesia}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience and Specialties */}
                  {(braider.yearsExperience || braider.specialties) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Experiência & Especialidades</h4>
                      <div className="space-y-2">
                        {braider.yearsExperience && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Experiência:</span>
                            <Badge variant="secondary">{braider.yearsExperience} anos</Badge>
                          </div>
                        )}
                        {braider.specialties && braider.specialties.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Especialidades:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {braider.specialties.slice(0, 3).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {braider.specialties.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{braider.specialties.length - 3} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Informações de Contato</h4>
                    <div className="space-y-3">
                      {braider.contactPhone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                            <Phone className="h-5 w-5 text-accent-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Telefone</div>
                            <div className="font-medium text-gray-900">{braider.contactPhone}</div>
                          </div>
                        </div>
                      )}
                      {braider.contactEmail && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-accent-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium text-gray-900">{braider.contactEmail}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Section */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6">Portfólio</h3>
                {braider.portfolioImages && braider.portfolioImages.length > 0 ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={braider.portfolioImages[currentPortfolioImageIndex] || "/placeholder.svg"}
                      alt={`Portfólio de ${braider.name} ${currentPortfolioImageIndex + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-[300px] object-cover"
                      unoptimized={true}
                    />
                    
                    {hasMultiplePortfolioImages && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full h-12 w-12"
                          onClick={handlePrevPortfolioImage}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full h-12 w-12"
                          onClick={handleNextPortfolioImage}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {braider.portfolioImages.map((_, index) => (
                            <button
                              key={index}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentPortfolioImageIndex
                                  ? "bg-white scale-125"
                                  : "bg-white/50 hover:bg-white/75"
                              }`}
                              onClick={() => setCurrentPortfolioImageIndex(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📸</div>
                    <p>Nenhuma imagem de portfólio disponível.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services Section */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6">Serviços Oferecidos</h3>
              
              {braider.services.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentServices.map((service) => (
                      <Card 
                        key={service.id} 
                        className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
                        onClick={() => handleServiceClick(service)}
                      >
                        <CardContent className="p-0">
                          {/* Service Image */}
                          <div className="relative h-32 overflow-hidden">
                            <Image
                              src={service.imageUrl || "/placeholder.svg?height=128&width=256&text=Serviço"}
                              alt={service.name}
                              width={256}
                              height={128}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              unoptimized={true}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-2 right-2">
                              <Badge className="bg-white/90 text-gray-800 text-xs font-semibold px-2 py-1">
                                €{service.price.toFixed(0)}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Service Info */}
                          <div className="p-3 space-y-2">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{service.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {service.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{service.durationMinutes}min</span>
                              </div>
                              <Button 
                                size="sm" 
                                className="h-6 px-2 text-xs bg-accent-500 hover:bg-accent-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectService(service)
                                }}
                              >
                                Agendar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-full"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={cn(
                              "rounded-full w-10 h-10",
                              currentPage === page 
                                ? "bg-accent-500 hover:bg-accent-600 text-white" 
                                : "hover:bg-gray-100"
                            )}
                          >
                            {page}
                          </Button>
                        )
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-full"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">✂️</div>
                  <p>Nenhum serviço disponível no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Service Detail Modal */}
      {selectedServiceForModal && (
        <ServiceDetailModal
          service={selectedServiceForModal}
          braiderName={braider?.name || ""}
          braiderRating={rating}
          braiderReviews={reviewCount}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelectService={handleSelectServiceModal}
        />
      )}

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

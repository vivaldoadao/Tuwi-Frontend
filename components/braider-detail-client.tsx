"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Star, Calendar, Heart, Share2, Clock } from "lucide-react"
import Link from "next/link"
import ServiceDetailModal from "@/components/service-detail-modal"
import { useFavorites } from "@/context/favorites-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import type { Braider, Service } from "@/lib/data"

interface BraiderDetailClientProps {
  braider: Braider
  serverGeneratedAt: string
  serverPerformance: {
    fetchTime: number
  }
}

export function BraiderDetailClient({ 
  braider, 
  serverGeneratedAt, 
  serverPerformance 
}: BraiderDetailClientProps) {
  const { isFavoriteBraider, toggleFavoriteBraider } = useFavorites()
  const { user } = useAuth()
  const router = useRouter()
  
  const [currentPortfolioImageIndex, setCurrentPortfolioImageIndex] = useState(0)
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const servicesPerPage = 8

  // 🖼️ PORTFOLIO NAVIGATION
  const nextPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prev) =>
      prev === braider.portfolioImages.length - 1 ? 0 : prev + 1
    )
  }

  const prevPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prev) =>
      prev === 0 ? braider.portfolioImages.length - 1 : prev - 1
    )
  }

  // ❤️ FAVORITES HANDLING
  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos')
      router.push('/login')
      return
    }
    
    toggleFavoriteBraider(braider.id)
    toast.success(
      isFavoriteBraider(braider.id) 
        ? 'Removida dos favoritos' 
        : 'Adicionada aos favoritos'
    )
  }

  // 📱 SHARE HANDLING
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${braider.name} - Trancista Profissional`,
          text: braider.bio,
          url: window.location.href,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copiado para clipboard!')
      }
    } catch (error) {
      toast.error('Erro ao compartilhar')
    }
  }

  // 🗓️ BOOKING HANDLING
  const handleBooking = () => {
    if (!user) {
      toast.error('Faça login para agendar serviços')
      router.push('/login')
      return
    }
    
    router.push(`/braiders/${braider.id}/book`)
  }

  // 📋 SERVICE MODAL
  const handleServiceClick = (service: Service) => {
    setSelectedServiceForModal(service)
    setIsModalOpen(true)
  }

  // 📊 PAGINATION para serviços
  const totalPages = Math.ceil(braider.services.length / servicesPerPage)
  const startIndex = (currentPage - 1) * servicesPerPage
  const currentServices = braider.services.slice(startIndex, startIndex + servicesPerPage)

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16">
      
      {/* 📊 Performance Stats (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Server: {serverPerformance.fetchTime}ms
              </div>
              <div>Cache: {new Date(serverGeneratedAt).toLocaleTimeString('pt')}</div>
              <div>Services: {braider.services.length}</div>
              <div>Portfolio: {braider.portfolioImages.length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🎬 ACTION BUTTONS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={handleBooking}
          size="lg" 
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Serviço
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={handleToggleFavorite}
          className={cn(
            "border-purple-200",
            isFavoriteBraider(braider.id) && "bg-purple-50 text-purple-600"
          )}
        >
          <Heart 
            className={cn(
              "h-4 w-4 mr-2",
              isFavoriteBraider(braider.id) && "fill-purple-600"
            )} 
          />
          {isFavoriteBraider(braider.id) ? 'Favorita' : 'Adicionar aos Favoritos'}
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={handleShare}
          className="border-purple-200"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 🖼️ PORTFOLIO */}
        {braider.portfolioImages && braider.portfolioImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfólio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="aspect-square relative rounded-lg overflow-hidden">
                  <Image
                    src={braider.portfolioImages[currentPortfolioImageIndex]}
                    alt={`Trabalho de ${braider.name} ${currentPortfolioImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {braider.portfolioImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                      onClick={prevPortfolioImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                      onClick={nextPortfolioImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex gap-2">
                        {braider.portfolioImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPortfolioImageIndex(index)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              index === currentPortfolioImageIndex 
                                ? "bg-white" 
                                : "bg-white/50"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🛍️ SERVICES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Serviços
              <Badge variant="secondary">{braider.services.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentServices.length > 0 ? (
              <div className="space-y-4">
                {currentServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="p-4 border rounded-lg hover:border-purple-300 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          €{service.price}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.durationMinutes} min
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum serviço disponível no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🔍 SERVICE DETAIL MODAL */}
      {selectedServiceForModal && (
        <ServiceDetailModal
          service={selectedServiceForModal}
          isOpen={isModalOpen}
          onSelectService={() => {
            // Handle service selection if needed
          }}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedServiceForModal(null)
          }}
        />
      )}
    </div>
  )
}
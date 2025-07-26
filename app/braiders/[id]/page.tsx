"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBraiderById } from "@/lib/data"
import { useFavorites } from "@/context/favorites-context"
import { MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Star, Calendar, Heart, Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, use } from "react"

export default function BraiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const braider = getBraiderById(id)
  const { isFavoriteBraider, toggleFavoriteBraider } = useFavorites()
  const [currentPortfolioImageIndex, setCurrentPortfolioImageIndex] = useState(0)
  
  const isLiked = isFavoriteBraider(braider?.id || "")

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
                          <span className="text-sm">{braider.location}</span>
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
                    <div className="flex gap-3 mt-4">
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
                      <Button
                        asChild
                        className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Link href={`/braiders/${braider.id}/book`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Agendar Serviço
                        </Link>
                      </Button>
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
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações de Contato</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                        <Phone className="h-5 w-5 text-accent-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Telefone</div>
                        <div className="font-medium text-gray-900">{braider.contactPhone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-accent-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium text-gray-900">{braider.contactEmail}</div>
                      </div>
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
              <div className="grid gap-6">
                {braider.services.map((service) => (
                  <Card key={service.id} className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-md rounded-2xl border-0 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <CardContent className="flex items-center gap-6 p-6">
                      <div className="relative">
                        <Image
                          src={service.imageUrl || "/placeholder.svg?height=100&width=100&text=Servico"}
                          alt={service.name}
                          width={100}
                          height={100}
                          className="rounded-xl object-cover shadow-md"
                          unoptimized={true}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-xl font-bold font-heading text-gray-900">{service.name}</h4>
                        <p className="text-gray-600 leading-relaxed">{service.description}</p>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{service.durationMinutes} minutos</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-accent-600">€{service.price.toFixed(0)}</div>
                        <div className="text-sm text-gray-500">por sessão</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

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

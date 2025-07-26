"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Braider } from "@/lib/data"
import { useFavorites } from "@/context/favorites-context"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight, Star, MessageCircle, Heart } from "lucide-react"
import { useState } from "react"

interface BraiderCardProps {
  braider: Braider
}

export default function BraiderCard({ braider }: BraiderCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { isFavoriteBraider, toggleFavoriteBraider } = useFavorites()

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % braider.portfolioImages.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? braider.portfolioImages.length - 1 : prevIndex - 1))
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleFavoriteBraider(braider.id)
  }

  // Verifica se há mais de uma imagem para exibir os controles do carrossel
  const hasMultipleImages = braider.portfolioImages && braider.portfolioImages.length > 1

  // Mock data for rating and availability
  const rating = 4.9
  const reviewCount = 127
  const isAvailable = true

  return (
    <Card className="group w-full max-w-sm overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 rounded-2xl">
      {/* Enhanced image section with better carousel */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={braider.portfolioImages[currentImageIndex] || "/placeholder.svg?height=300&width=400&text=Trancista"}
          alt={braider.name}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={true}
        />
        
        {/* Glassmorphism gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Status badge */}
        <div className="absolute top-4 left-4">
          <Badge className={`px-3 py-1 rounded-full text-white ${
            isAvailable 
              ? 'bg-green-500 hover:bg-green-500' 
              : 'bg-red-500 hover:bg-red-500'
          }`}>
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>

        {/* Favorite button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleToggleFavorite}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavoriteBraider(braider.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-700'}`} />
          </Button>
        </div>

        {/* Modern carousel controls */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-white/20 rounded-full h-10 w-10"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-white/20 rounded-full h-10 w-10"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            {/* Modern dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {braider.portfolioImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? "bg-white scale-125" 
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Name and rating */}
        <div className="space-y-2">
          <Link href={`/braiders/${braider.id}`}>
            <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-brand-700 transition-colors font-heading">
              {braider.name}
            </CardTitle>
          </Link>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
              <span className="text-sm font-medium text-gray-700">{rating}</span>
            </div>
            <span className="text-sm text-gray-500">({reviewCount} avaliações)</span>
          </div>
        </div>
        
        {/* Bio */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{braider.bio}</p>
        
        {/* Enhanced contact info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-brand-600" />
            </div>
            <span>{braider.location}</span>
          </div>
          
          {braider.contactPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                <Phone className="h-3 w-3 text-brand-600" />
              </div>
              <span>{braider.contactPhone}</span>
            </div>
          )}
          
          {braider.contactEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                <Mail className="h-3 w-3 text-brand-600" />
              </div>
              <span className="truncate">{braider.contactEmail}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Link href={`/braiders/${braider.id}`}>Ver Perfil</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleFavorite}
            className={`border-brand-200 rounded-xl transition-colors ${
              isFavoriteBraider(braider.id) 
                ? 'bg-pink-50 border-pink-300 hover:bg-pink-100' 
                : 'hover:bg-brand-50'
            }`}
          >
            <Heart className={`h-4 w-4 transition-colors ${
              isFavoriteBraider(braider.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-600'
            }`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-brand-200 hover:bg-brand-50 rounded-xl"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

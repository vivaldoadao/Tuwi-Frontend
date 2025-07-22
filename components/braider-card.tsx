"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Braider } from "@/lib/data"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react" // Importar ícones de seta
import { useState } from "react" // Importar useState

interface BraiderCardProps {
  braider: Braider
}

export default function BraiderCard({ braider }: BraiderCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % braider.portfolioImages.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? braider.portfolioImages.length - 1 : prevIndex - 1))
  }

  // Verifica se há mais de uma imagem para exibir os controles do carrossel
  const hasMultipleImages = braider.portfolioImages && braider.portfolioImages.length > 1

  return (
    <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg bg-white text-gray-900">
      <CardHeader className="p-0 relative">
        <Image
          src={braider.portfolioImages[currentImageIndex] || "/placeholder.svg?height=300&width=400&text=Trancista"}
          alt={braider.name}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
          unoptimized={true}
        />
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Imagem anterior</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Próxima imagem</span>
            </Button>
            {/* Indicadores de imagem (dots) */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {braider.portfolioImages.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-gray-400"}`}
                />
              ))}
            </div>
          </>
        )}
      </CardHeader>
      <CardContent className="p-4 grid gap-2">
        <Link href={`/braiders/${braider.id}`}>
          <CardTitle className="text-xl font-bold text-brand-primary hover:text-brand-accent transition-colors">
            {braider.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-gray-700 line-clamp-2">{braider.bio}</p>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1 text-brand-accent" />
          {braider.location}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-1 text-brand-accent" />
          {braider.contactPhone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-1 text-brand-accent" />
          {braider.contactEmail}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-4 py-2 rounded-md transition-colors"
        >
          <Link href={`/braiders/${braider.id}`}>Ver Perfil</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

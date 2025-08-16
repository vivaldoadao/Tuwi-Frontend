"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  Download,
  Grid3X3,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PortfolioGalleryProps {
  images: string[]
  braiderName?: string
  className?: string
}

interface ModalState {
  isOpen: boolean
  currentIndex: number
  showThumbnails: boolean
}

export function PortfolioGallery({ 
  images, 
  braiderName = "Trancista",
  className 
}: PortfolioGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    currentIndex: 0,
    showThumbnails: false
  })
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})

  const hasMultipleImages = images.length > 1

  // Preload next and previous images for better performance
  useEffect(() => {
    if (images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length
      const prevIndex = (currentIndex - 1 + images.length) % images.length
      
      // Preload adjacent images
      [nextIndex, prevIndex].forEach(index => {
        if (images[index]) {
          const img = new window.Image()
          img.src = images[index]
        }
      })
    }
  }, [currentIndex, images])

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (hasMultipleImages) {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }
  }, [hasMultipleImages, images.length])

  const handlePrev = useCallback(() => {
    if (hasMultipleImages) {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
    }
  }, [hasMultipleImages, images.length])

  // Modal handlers
  const openModal = (index: number = currentIndex) => {
    setModal({
      isOpen: true,
      currentIndex: index,
      showThumbnails: false
    })
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
    document.body.style.overflow = 'unset'
  }

  const handleModalNext = () => {
    setModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % images.length
    }))
  }

  const handleModalPrev = () => {
    setModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + images.length) % images.length
    }))
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modal.isOpen) {
        switch (e.key) {
          case 'Escape':
            closeModal()
            break
          case 'ArrowLeft':
            e.preventDefault()
            handleModalPrev()
            break
          case 'ArrowRight':
            e.preventDefault()
            handleModalNext()
            break
          case 'g':
            e.preventDefault()
            setModal(prev => ({ ...prev, showThumbnails: !prev.showThumbnails }))
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modal.isOpen, handleModalNext, handleModalPrev])

  // Handle image load state
  const handleImageLoad = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }))
  }

  const handleImageLoadStart = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: true }))
  }

  if (!images || images.length === 0) {
    return (
      <div className={cn("text-center py-12 text-gray-500", className)}>
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-medium mb-2">Nenhuma imagem de portfólio</h3>
        <p className="text-sm">Este profissional ainda não adicionou imagens ao seu portfólio.</p>
      </div>
    )
  }

  return (
    <>
      {/* Main Gallery */}
      <div className={cn("space-y-4", className)}>
        {/* Main Image Display */}
        <Card className="overflow-hidden rounded-2xl shadow-lg group cursor-pointer" onClick={() => openModal()}>
          <div className="relative aspect-[4/3] bg-gray-100">
            {imageLoading[currentIndex] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
            
            <Image
              src={images[currentIndex]}
              alt={`Portfólio de ${braiderName} - Imagem ${currentIndex + 1}`}
              fill
              className={cn(
                "object-cover transition-all duration-300 group-hover:scale-105",
                imageLoading[currentIndex] ? "opacity-0" : "opacity-100"
              )}
              priority={currentIndex === 0}
              onLoadingComplete={() => handleImageLoad(currentIndex)}
              onLoadStart={() => handleImageLoadStart(currentIndex)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-white/90 hover:bg-white text-gray-900"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 bg-black/70 text-white border-0"
            >
              {currentIndex + 1} / {images.length}
            </Badge>
          </div>
        </Card>

        {/* Thumbnail Navigation */}
        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  index === currentIndex 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {index !== currentIndex && (
                  <div className="absolute inset-0 bg-black/20" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{images.length} {images.length === 1 ? 'imagem' : 'imagens'} no portfólio</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal()}
            className="h-auto p-1 hover:bg-gray-100"
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Ver galeria completa
          </Button>
        </div>
      </div>

      {/* Full Screen Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Modal Content */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Main Image */}
            <div className="relative max-w-7xl max-h-full">
              <Image
                src={images[modal.currentIndex]}
                alt={`Portfólio de ${braiderName} - Imagem ${modal.currentIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-[80vh] object-contain"
                priority
                sizes="100vw"
              />
            </div>

            {/* Modal Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <Badge variant="secondary" className="bg-black/50 text-white border-0">
                {modal.currentIndex + 1} / {images.length}
              </Badge>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModal(prev => ({ ...prev, showThumbnails: !prev.showThumbnails }))}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <Grid3X3 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Thumbnail Strip */}
            {modal.showThumbnails && hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-3 rounded-lg backdrop-blur-sm max-w-full overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setModal(prev => ({ ...prev, currentIndex: index }))}
                    className={cn(
                      "relative flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all duration-200",
                      index === modal.currentIndex 
                        ? "border-white ring-2 ring-white/50" 
                        : "border-white/30 hover:border-white/60"
                    )}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Hints */}
            <div className="absolute bottom-4 right-4 text-white/70 text-xs space-y-1">
              <p>← → Navegar</p>
              <p>G Galeria</p>
              <p>ESC Fechar</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
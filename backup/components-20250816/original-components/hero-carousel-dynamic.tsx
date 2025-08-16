"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingBag, Users, ChevronDown } from "lucide-react"
import { type HeroSlideData } from "@/lib/cms-content"

interface HeroSlide extends HeroSlideData {
  id: string
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
}

const swipeConfidenceThreshold = 10000
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
}

interface HeroCarouselDynamicProps {
  slides: HeroSlideData[]
}

export default function HeroCarouselDynamic({ slides }: HeroCarouselDynamicProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({})

  const heroSlides: HeroSlide[] = slides.map((slide, index) => ({
    ...slide,
    id: `slide-${index + 1}`
  }))

  // Preload images
  useEffect(() => {
    heroSlides.forEach((slide, index) => {
      if (slide.imageUrl && !imagesLoaded[slide.id]) {
        const img = new window.Image()
        img.onload = () => {
          setImagesLoaded(prev => ({
            ...prev,
            [slide.id]: true
          }))
        }
        img.src = slide.imageUrl
      }
    })
  }, [heroSlides, imagesLoaded])

  const paginate = (newDirection: number) => {
    const newIndex = (currentIndex + newDirection + heroSlides.length) % heroSlides.length
    setDirection(newDirection)
    setCurrentIndex(newIndex)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  useEffect(() => {
    if (heroSlides.length === 0) return

    const timer = setInterval(() => {
      paginate(1)
    }, 8000)

    return () => clearInterval(timer)
  }, [currentIndex, heroSlides.length])

  if (heroSlides.length === 0) {
    return (
      <section className="relative min-h-screen bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">WILNARA TRANÇAS</h1>
          <p className="text-xl">Carregando...</p>
        </div>
      </section>
    )
  }

  const currentSlide = heroSlides[currentIndex]

  return (
    <section className="relative min-h-screen overflow-hidden bg-gray-900">
      {/* Background Images - Preload and transition between them */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              transitionDelay: index === currentIndex ? '0ms' : '100ms'
            }}
          >
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt={slide.subtitle || "Hero slide"}
                fill
                className="object-cover"
                priority={index <= 1} // Prioriza as 2 primeiras imagens
                sizes="100vw"
                quality={90}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Content - Box Positioned at Bottom */}
      <div className="relative z-20 min-h-screen flex items-end justify-center pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            key={`hero-box-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Main Content Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl border border-white/20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-heading">
                  {currentSlide?.title || "WILNARA TRANÇAS"}
                </h1>
                <h2 className="text-xl md:text-3xl lg:text-4xl text-accent-200 mb-8 font-medium">
                  {currentSlide?.subtitle || "Beleza e Tradição"}
                </h2>
                <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                  {currentSlide?.description || "Descubra a arte das tranças africanas."}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Link href={(currentSlide?.ctaLink as any) || "/products"}>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {currentSlide?.ctaText || "Ver Produtos"}
                  </Link>
                </Button>
                {currentSlide?.secondaryCtaText && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-brand-400 text-brand-400 hover:bg-brand-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
                  >
                    <Link href={(currentSlide.secondaryCtaLink as any) || "/braiders"}>
                      <Users className="mr-2 h-5 w-5" />
                      {currentSlide.secondaryCtaText}
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {heroSlides.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 hover:scale-110"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 hover:scale-110"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white shadow-lg scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-8 z-20 hidden md:flex flex-col items-center text-white">
        <span className="text-sm mb-2 opacity-75">Scroll</span>
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </div>
    </section>
  )
}
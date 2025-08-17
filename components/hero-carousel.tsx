"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingBag, Users, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

const heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "TUWI",
    subtitle: "Beleza Africana em Portugal",
    description: "Realce a sua beleza natural com os nossos profissionais especializados em cuidados africanos. Estilo, conforto e qualidade em cada serviço.",
    imageUrl: "/hero-braids.png",
    ctaText: "Ver Produtos",
    ctaLink: "/products",
    secondaryCtaText: "Ver Profissionais",
    secondaryCtaLink: "/braiders"
  },
  {
    id: "2", 
    title: "TUWI",
    subtitle: "Tranças Africanas Autênticas",
    description: "Transforme o seu visual com as nossas tranças africanas autênticas. Cada trança é uma obra de arte que celebra a sua individualidade.",
    imageUrl: "/hero-braids.png", // Você pode substituir por imagens específicas
    ctaText: "Ver Serviços",
    ctaLink: "/products",
    secondaryCtaText: "Encontrar Profissionais",
    secondaryCtaLink: "/braiders"
  },
  {
    id: "3",
    title: "TUWI", 
    subtitle: "Cuidados Capilares Africanos",
    description: "Descubra a versatilidade dos cuidados capilares africanos. Proteção capilar e estilo combinados para um visual autêntico e contemporâneo.",
    imageUrl: "/hero-braids.png", // Você pode substituir por imagens específicas
    ctaText: "Ver Produtos",
    ctaLink: "/products",
    secondaryCtaText: "Ver Profissionais",
    secondaryCtaLink: "/braiders"
  }
]

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality  
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const currentSlideData = heroSlides[currentSlide]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images with Parallax Effect */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentSlide ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.subtitle}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-brand-900/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Glassmorphism Content Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Brand Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-white via-white to-accent-200 bg-clip-text text-transparent">
                {currentSlideData.title}
              </span>
            </h1>

            {/* Subtitle */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-accent-300 mb-4 font-heading">
              {currentSlideData.subtitle}
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              {currentSlideData.description}
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link href={currentSlideData.ctaLink as any}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {currentSlideData.ctaText}
                </Link>
              </Button>

              {currentSlideData.secondaryCtaText && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
                >
                  <Link href={currentSlideData.secondaryCtaLink! as any}>
                    <Users className="mr-2 h-5 w-5" />
                    {currentSlideData.secondaryCtaText}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevSlide}
          className="ml-4 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all duration-300"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextSlide}
          className="mr-4 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all duration-300"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300 backdrop-blur-sm",
              index === currentSlide
                ? "bg-accent-400 scale-125 shadow-lg"
                : "bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar - Simplified */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-accent-500 transition-all duration-300"
          style={{
            width: isAutoPlaying ? '100%' : '0%'
          }}
        />
      </div>

      {/* Animated Scroll Indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2 font-medium">Scroll para explorar</span>
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>

    </section>
  )
}
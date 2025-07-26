"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingBag, Users, ChevronDown } from "lucide-react"

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
    title: "WILNARA TRANÇAS",
    subtitle: "Box Braids Elegantes",
    description: "Realce sua beleza natural com nossas box braids profissionais. Estilo, conforto e durabilidade em cada fio trançado com perfeição.",
    imageUrl: "/hero-braids.png",
    ctaText: "Compre Agora",
    ctaLink: "/products",
    secondaryCtaText: "Ver Trancistas",
    secondaryCtaLink: "/braiders"
  },
  {
    id: "2", 
    title: "WILNARA TRANÇAS",
    subtitle: "Goddess Braids Luxuosas",
    description: "Transforme seu visual com nossas goddess braids artesanais. Cada trança é uma obra de arte que celebra sua individualidade.",
    imageUrl: "/hero-braids.png",
    ctaText: "Explorar Estilos",
    ctaLink: "/products",
    secondaryCtaText: "Agendar Serviço",
    secondaryCtaLink: "/braiders"
  },
  {
    id: "3",
    title: "WILNARA TRANÇAS", 
    subtitle: "Twist Braids Modernas",
    description: "Descubra a versatilidade dos twist braids. Proteção capilar e estilo combinados para um visual autêntico e contemporâneo.",
    imageUrl: "/hero-braids.png",
    ctaText: "Ver Coleção",
    ctaLink: "/products",
    secondaryCtaText: "Encontrar Profissional",
    secondaryCtaLink: "/braiders"
  }
]

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

export default function HeroCarouselOptimized() {
  const [[currentSlide, direction], setCurrentSlide] = useState([0, 0])
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => [prev[0] + 1, 1])
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // Wrap around slide index
  const slideIndex = ((currentSlide % heroSlides.length) + heroSlides.length) % heroSlides.length

  const paginate = (newDirection: number) => {
    setCurrentSlide([currentSlide + newDirection, newDirection])
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToSlide = (index: number) => {
    const newDirection = index > slideIndex ? 1 : -1
    setCurrentSlide([index, newDirection])
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const currentSlideData = heroSlides[slideIndex]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images with AnimatePresence */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1)
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1)
              }
            }}
            className="absolute inset-0"
          >
            <Image
              src={currentSlideData.imageUrl}
              alt={currentSlideData.subtitle}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-brand-900/60" />
      </div>

      {/* Main Content with Animation */}
      <motion.div 
        key={slideIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 max-w-6xl mx-auto px-4 text-center"
      >
        {/* Glassmorphism Content Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Brand Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading text-white mb-4 tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-white to-accent-200 bg-clip-text text-transparent">
                {currentSlideData.title}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-3xl lg:text-4xl font-semibold text-accent-300 mb-4 font-heading"
            >
              {currentSlideData.subtitle}
            </motion.h2>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {currentSlideData.description}
            </motion.p>

            {/* Call to Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
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
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => paginate(-1)}
          className="ml-4 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all duration-300"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => paginate(1)}
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
            className={`w-3 h-3 rounded-full transition-all duration-300 backdrop-blur-sm ${
              index === slideIndex
                ? "bg-accent-400 scale-125 shadow-lg"
                : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-400 to-accent-500"
          initial={{ width: "0%" }}
          animate={{ width: isAutoPlaying ? "100%" : "0%" }}
          transition={{ 
            duration: isAutoPlaying ? 5 : 0,
            ease: "linear",
            repeat: isAutoPlaying ? Infinity : 0
          }}
        />
      </div>

      {/* Animated Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center text-white/70"
        >
          <span className="text-sm mb-2 font-medium">Scroll para explorar</span>
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </motion.div>
    </section>
  )
}
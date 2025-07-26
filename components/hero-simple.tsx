"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Users, ChevronDown } from "lucide-react"

export default function HeroSimple() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Single Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-braids.png"
          alt="Wilnara Tranças - Box Braids Elegantes"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
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
                WILNARA TRANÇAS
              </span>
            </h1>

            {/* Subtitle */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-accent-300 mb-4 font-heading">
              Box Braids Elegantes
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Realce sua beleza natural com nossas tranças e postiços de alta qualidade. Estilo, conforto e durabilidade em cada fio trançado com perfeição.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Compre Agora
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              >
                <Link href="/braiders">
                  <Users className="mr-2 h-5 w-5" />
                  Ver Trancistas
                </Link>
              </Button>
            </div>
          </div>
        </div>
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
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HeroBannerData {
  title: string
  subtitle: string
  description: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

interface HeroBannerPromotion {
  id: string
  title: string
  content_data: HeroBannerData
  user_id: string
  start_date: string
  end_date: string
  views_count: number
  clicks_count: number
}

interface DynamicHeroBannerProps {
  fallbackContent?: HeroBannerData
  className?: string
}

export function DynamicHeroBanner({ 
  fallbackContent,
  className 
}: DynamicHeroBannerProps) {
  const [heroBanner, setHeroBanner] = useState<HeroBannerPromotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHeroBanner()
  }, [])

  const fetchHeroBanner = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/promotions/public?type=hero')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setHeroBanner(data.hero_banner)

    } catch (error) {
      console.error('Error fetching hero banner:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar banner')
    } finally {
      setLoading(false)
    }
  }

  const handleCTAClick = async (isSecondary: boolean = false) => {
    if (!heroBanner) return

    try {
      // Registrar clique na promoção
      await fetch('/api/promotions/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: heroBanner.id,
          action: 'click',
          metadata: {
            cta_type: isSecondary ? 'secondary' : 'primary',
            source: 'hero_banner',
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Error tracking hero banner click:', error)
    }
  }

  // Usar conteúdo promocional ou fallback
  const content = heroBanner?.content_data || fallbackContent
  const isPromoted = !!heroBanner

  if (loading && !content) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="animate-pulse bg-gradient-to-r from-purple-600 to-blue-600 min-h-[500px] flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-12 bg-white/20 rounded w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-white/20 rounded w-96 mx-auto mb-6"></div>
            <div className="h-12 bg-white/20 rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !content) {
    return null // Não mostrar banner se houver erro e não houver fallback
  }

  if (!content) {
    return null
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        {content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Se falhar, usar gradiente como fallback
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-600/70 to-blue-600/80"></div>
        
        {/* Overlay para melhor contraste */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Badge de Promoção */}
      {isPromoted && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-white/90 text-purple-800 border-0 px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Patrocinado
          </Badge>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-[500px] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            {/* Título Principal */}
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-white mb-4 leading-tight">
              {content.title}
            </h1>

            {/* Subtítulo */}
            <h2 className="text-2xl md:text-4xl text-purple-200 mb-6 font-medium">
              {content.subtitle}
            </h2>

            {/* Descrição */}
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
              {content.description}
            </p>

            {/* Call-to-Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* CTA Primário */}
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 font-semibold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                asChild
                onClick={() => handleCTAClick(false)}
              >
                <Link href={content.ctaLink}>
                  {content.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              {/* CTA Secundário */}
              {content.secondaryCtaText && content.secondaryCtaLink && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
                  asChild
                  onClick={() => handleCTAClick(true)}
                >
                  <Link href={content.secondaryCtaLink}>
                    {content.secondaryCtaText}
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Métricas (apenas se for promoção) */}
            {isPromoted && heroBanner && (
              <div className="mt-8 flex gap-6 text-sm text-white/70">
                <div>
                  <span className="font-medium">{heroBanner.views_count}</span> visualizações
                </div>
                <div>
                  <span className="font-medium">{heroBanner.clicks_count}</span> cliques
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Elementos Decorativos */}
      <div className="absolute top-1/4 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 left-10 w-32 h-32 bg-purple-300/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-blue-300/10 rounded-full blur-xl"></div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}

// Conteúdo padrão para quando não há promoções ativas
export const defaultHeroContent: HeroBannerData = {
  title: "WILNARA TRANÇAS",
  subtitle: "Beleza Autêntica em Cada Fio",
  description: "Descubra as melhores profissionais de tranças da sua região. Qualidade, tradição e beleza em um só lugar.",
  imageUrl: "/hero-background.jpg", // Você precisará adicionar esta imagem
  ctaText: "Encontrar Trancistas",
  ctaLink: "/braiders",
  secondaryCtaText: "Sobre Nós",
  secondaryCtaLink: "/about"
}
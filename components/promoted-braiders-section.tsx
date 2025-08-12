"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Star,
  MapPin, 
  Eye,
  MessageCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface PromotedBraider {
  id: string
  name: string
  email: string
  profileImageUrl?: string
  location?: string
  specialties: string[]
  rating?: number
  reviewCount?: number
  verified?: boolean
  promotion: {
    id: string
    type: 'profile_highlight' | 'hero_banner' | 'combo_package'
    start_date: string
    end_date: string
    views_count: number
    clicks_count: number
  }
}

interface PromotedBraidersSectionProps {
  className?: string
  showTitle?: boolean
  limit?: number
  location?: string
  specialty?: string
}

export function PromotedBraidersSection({ 
  className,
  showTitle = true,
  limit = 6,
  location,
  specialty
}: PromotedBraidersSectionProps) {
  const [promotedBraiders, setPromotedBraiders] = useState<PromotedBraider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPromotedBraiders()
  }, [location, specialty, limit])

  const fetchPromotedBraiders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        type: 'braiders',
        limit: limit.toString()
      })
      
      if (location) params.append('location', location)
      if (specialty) params.append('specialty', specialty)

      const response = await fetch(`/api/promotions/public?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPromotedBraiders(data.promoted_braiders || [])

    } catch (error) {
      console.error('Error fetching promoted braiders:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar perfis em destaque')
    } finally {
      setLoading(false)
    }
  }

  const handleBraiderClick = async (braider: PromotedBraider) => {
    try {
      // Registrar clique na promoção
      await fetch('/api/promotions/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: braider.promotion.id,
          action: 'click',
          metadata: {
            braider_id: braider.id,
            source: 'promoted_section',
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Error tracking click:', error)
      // Não impedir navegação por erro de tracking
    }
  }

  const getPromotionBadge = (type: string) => {
    switch (type) {
      case 'profile_highlight':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )
      case 'combo_package':
        return (
          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Promovido
          </Badge>
        )
    }
  }

  if (loading && promotedBraiders.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showTitle && (
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-2">❌ {error}</div>
        <Button variant="outline" onClick={fetchPromotedBraiders}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (promotedBraiders.length === 0) {
    return null // Não mostrar seção se não há perfis promovidos
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Crown className="h-8 w-8 text-purple-600" />
            Trancistas em Destaque
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conheça as profissionais que se destacam pela qualidade e excelência em seus serviços
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotedBraiders.map((braider) => (
          <Card 
            key={braider.id} 
            className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-purple-100 hover:border-purple-200"
          >
            <CardContent className="p-6">
              {/* Badge de Promoção */}
              <div className="flex justify-between items-start mb-4">
                {getPromotionBadge(braider.promotion.type)}
                {braider.verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Verificada
                  </Badge>
                )}
              </div>

              {/* Foto de Perfil */}
              <div className="relative mb-4">
                <div className="w-20 h-20 mx-auto relative">
                  <Image
                    src={braider.profileImageUrl || '/placeholder-avatar.png'}
                    alt={braider.name}
                    fill
                    className="rounded-full object-cover border-4 border-purple-100 group-hover:border-purple-200 transition-colors"
                  />
                  {/* Indicador de destaque */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Informações da Trancista */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {braider.name}
                </h3>
                
                {braider.location && (
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{braider.location}</span>
                  </div>
                )}

                {braider.rating && (
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{braider.rating.toFixed(1)}</span>
                    {braider.reviewCount && (
                      <span className="text-gray-500 text-sm">
                        ({braider.reviewCount} avaliações)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Especialidades */}
              {braider.specialties.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap justify-center gap-1">
                    {braider.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {specialty}
                      </Badge>
                    ))}
                    {braider.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        +{braider.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Métricas de Engajamento */}
              <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{braider.promotion.views_count} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{braider.promotion.clicks_count} clicks</span>
                </div>
              </div>

              {/* Botão de Ação */}
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group-hover:shadow-lg"
                onClick={() => handleBraiderClick(braider)}
              >
                <Link href={`/braiders/${braider.id}`}>
                  Ver Perfil
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão Ver Mais */}
      {promotedBraiders.length >= limit && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            asChild
          >
            <Link href="/braiders">
              Ver Todas as Trancistas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
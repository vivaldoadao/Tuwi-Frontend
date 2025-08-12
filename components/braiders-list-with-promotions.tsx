"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Crown, 
  Star,
  MapPin, 
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowRight,
  RefreshCw
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePromotedBraiders } from "@/hooks/use-promotions"

interface BraidersListProps {
  className?: string
  showFilters?: boolean
  showPromotedFirst?: boolean
  limit?: number
}

export function BraidersListWithPromotions({ 
  className,
  showFilters = true,
  showPromotedFirst = true,
  limit = 20
}: BraidersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")

  const {
    promotedBraiders,
    regularBraiders,
    loading,
    error,
    refresh,
    trackClick,
    hasPromotions,
    total
  } = usePromotedBraiders({
    location: locationFilter !== "all" ? locationFilter : undefined,
    specialty: specialtyFilter !== "all" ? specialtyFilter : undefined,
    limit
  })

  // Filtrar braiders baseado na busca
  const filteredPromoted = promotedBraiders.filter(braider =>
    braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    braider.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    braider.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredRegular = regularBraiders.filter(braider =>
    braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    braider.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    braider.specialties?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Combinar listas - promovidos primeiro se habilitado
  const allBraiders = showPromotedFirst 
    ? [...filteredPromoted, ...filteredRegular]
    : [...filteredRegular, ...filteredPromoted]

  const getPromotionBadge = (type?: string) => {
    if (!type) return null
    
    switch (type) {
      case 'profile_highlight':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-2">
            <Crown className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )
      case 'combo_package':
        return (
          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            Promovido
          </Badge>
        )
    }
  }

  const handleBraiderClick = async (braider: any, isPromoted: boolean) => {
    if (isPromoted && braider.promotion) {
      await trackClick(braider.promotion.id, {
        braider_id: braider.id,
        source: 'braiders_list',
        search_term: searchTerm,
        location_filter: locationFilter !== "all" ? locationFilter : null,
        specialty_filter: specialtyFilter !== "all" ? specialtyFilter : null
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setLocationFilter("all")
    setSpecialtyFilter("all")
  }

  if (loading && allBraiders.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showFilters && (
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, localização ou especialidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Localização" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as localizações</SelectItem>
                      <SelectItem value="Lisboa">Lisboa</SelectItem>
                      <SelectItem value="Porto">Porto</SelectItem>
                      <SelectItem value="Coimbra">Coimbra</SelectItem>
                      <SelectItem value="Braga">Braga</SelectItem>
                      <SelectItem value="Faro">Faro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as especialidades</SelectItem>
                      <SelectItem value="Box Braids">Box Braids</SelectItem>
                      <SelectItem value="Knotless Braids">Knotless Braids</SelectItem>
                      <SelectItem value="French Braids">French Braids</SelectItem>
                      <SelectItem value="Cornrows">Cornrows</SelectItem>
                      <SelectItem value="Twist Braids">Twist Braids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={refresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de Promoções */}
      {hasPromotions && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-800">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">
              {filteredPromoted.length} perfis em destaque encontrados
            </span>
          </div>
        </div>
      )}

      {/* Lista de Braiders */}
      {error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">❌ {error}</div>
            <Button onClick={refresh}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      ) : allBraiders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              Nenhuma trancista encontrada com os filtros aplicados
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBraiders.map((braider) => {
            const isPromoted = !!braider.promotion
            
            return (
              <Card 
                key={braider.id} 
                className={`group hover:shadow-lg transition-all duration-300 ${
                  isPromoted ? 'border-2 border-purple-200 hover:border-purple-300' : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-6">
                  {/* Badge de Promoção */}
                  {getPromotionBadge(braider.promotion?.type)}

                  {/* Foto de Perfil */}
                  <div className="relative mb-4">
                    <div className="w-20 h-20 mx-auto relative">
                      <Image
                        src={braider.profileImageUrl || '/placeholder-avatar.png'}
                        alt={braider.name}
                        fill
                        className="rounded-full object-cover"
                      />
                      {isPromoted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg mb-1">{braider.name}</h3>
                    
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
                            ({braider.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Especialidades */}
                  {braider.specialties && braider.specialties.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap justify-center gap-1">
                        {braider.specialties.slice(0, 2).map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {braider.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{braider.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Métricas de Promoção */}
                  {isPromoted && (
                    <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{braider.promotion.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{braider.promotion.clicks_count}</span>
                      </div>
                    </div>
                  )}

                  {/* Botão */}
                  <Button
                    asChild
                    className={`w-full ${
                      isPromoted 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : ''
                    }`}
                    onClick={() => handleBraiderClick(braider, isPromoted)}
                  >
                    <Link href={`/braiders/${braider.id}`}>
                      Ver Perfil
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Informações de Resultado */}
      <div className="text-center text-gray-600">
        {hasPromotions ? (
          <p>
            Mostrando {allBraiders.length} trancistas 
            ({filteredPromoted.length} em destaque, {filteredRegular.length} regulares)
          </p>
        ) : (
          <p>Mostrando {allBraiders.length} trancistas</p>
        )}
      </div>
    </div>
  )
}
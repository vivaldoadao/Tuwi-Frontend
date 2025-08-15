'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RatingCard } from './rating-card'
import { StarDisplay, RatingBreakdown } from './star-rating'
import { useToast } from '@/hooks/use-toast'
import { 
  Star, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Users,
  Calendar,
  Shield,
  Image,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Rating {
  id: string
  overall_rating: number
  quality_rating?: number
  punctuality_rating?: number
  communication_rating?: number
  professionalism_rating?: number
  review_title?: string
  review_text?: string
  client_name: string
  review_images?: string[]
  is_verified: boolean
  braider_response?: string
  braider_response_date?: string
  created_at: string
  services?: {
    id: string
    name: string
    price: number
  }
  bookings?: {
    id: string
    booking_date: string
    booking_time: string
  }
}

interface RatingsListProps {
  braiderId: string
  braiderName: string
  currentUserId?: string
  userRole?: 'customer' | 'braider' | 'admin'
  showBraiderActions?: boolean
  initialRatings?: Rating[]
  onRatingEdit?: (ratingId: string) => void
  onRatingDelete?: (ratingId: string) => Promise<void>
  onRatingReport?: (ratingId: string, reason: string, description: string) => Promise<void>
  onRatingRespond?: (ratingId: string, response: string) => Promise<void>
}

interface RatingStats {
  braider_id: string
  total_ratings: number
  average_rating: number
  rating_1_count: number
  rating_2_count: number
  rating_3_count: number
  rating_4_count: number
  rating_5_count: number
  avg_quality?: number
  avg_punctuality?: number
  avg_communication?: number
  avg_professionalism?: number
  has_recent_ratings: boolean
  braider_info: {
    id: string
    name: string
    average_rating: number
    total_reviews: number
  }
}

export function RatingsList({
  braiderId,
  braiderName,
  currentUserId,
  userRole,
  showBraiderActions = false,
  initialRatings,
  onRatingEdit,
  onRatingDelete,
  onRatingReport,
  onRatingRespond
}: RatingsListProps) {
  const { toast } = useToast()

  const [ratings, setRatings] = useState<Rating[]>(initialRatings || [])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(!initialRatings)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null)
  const [filterWithImages, setFilterWithImages] = useState<boolean | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Fetch ratings
  const fetchRatings = async (reset = false) => {
    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({
        braiderId,
        includeStats: 'true',
        limit: limit.toString(),
        offset: (reset ? 0 : offset).toString()
      })

      // Add filters
      if (filterRating !== 'all') {
        params.append('minRating', filterRating)
        params.append('maxRating', filterRating)
      }
      if (filterVerified === true) {
        params.append('verified', 'true')
      }
      if (filterWithImages === true) {
        params.append('hasImages', 'true')
      }

      const response = await fetch(`/api/braiders/${braiderId}/ratings?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar avaliações')
      }

      if (reset) {
        setRatings(data.ratings)
        setOffset(data.pagination.limit)
      } else {
        setRatings(prev => [...prev, ...data.ratings])
        setOffset(prev => prev + data.pagination.limit)
      }

      setStats(data.stats)
      setHasMore(data.pagination.hasMore)

    } catch (error) {
      console.error('Error fetching ratings:', error)
      toast({
        title: "Erro ao carregar avaliações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Apply filters and sorting
  const filteredAndSortedRatings = () => {
    let filtered = [...ratings]

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(rating =>
        rating.review_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'highest':
          return b.overall_rating - a.overall_rating
        case 'lowest':
          return a.overall_rating - b.overall_rating
        default:
          return 0
      }
    })

    return filtered
  }

  // Load initial data
  useEffect(() => {
    if (!initialRatings) {
      fetchRatings(true)
    }
  }, [braiderId, filterRating, filterVerified, filterWithImages])

  const displayedRatings = filteredAndSortedRatings()
  const hasActiveFilters = searchTerm || filterRating !== 'all' || filterVerified !== null || filterWithImages !== null

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Avaliações de {braiderName}
              </div>
              <Badge variant="secondary">
                {stats.total_ratings} {stats.total_ratings === 1 ? 'avaliação' : 'avaliações'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average rating */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.average_rating.toFixed(1)}
                </div>
                <StarDisplay 
                  rating={stats.average_rating} 
                  size="lg" 
                  className="justify-center mb-2" 
                />
                <p className="text-sm text-gray-600">
                  Baseado em {stats.total_ratings} {stats.total_ratings === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              {/* Rating breakdown */}
              <div>
                <h4 className="font-medium mb-3">Distribuição das avaliações</h4>
                <RatingBreakdown stats={stats} />
              </div>
            </div>

            {/* Detailed averages (if available) */}
            {(stats.avg_quality || stats.avg_punctuality || stats.avg_communication || stats.avg_professionalism) && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Médias por categoria</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.avg_quality && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.avg_quality.toFixed(1)}</div>
                      <StarDisplay rating={stats.avg_quality} size="sm" className="justify-center" />
                      <p className="text-xs text-gray-600 mt-1">Qualidade</p>
                    </div>
                  )}
                  
                  {stats.avg_punctuality && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.avg_punctuality.toFixed(1)}</div>
                      <StarDisplay rating={stats.avg_punctuality} size="sm" className="justify-center" />
                      <p className="text-xs text-gray-600 mt-1">Pontualidade</p>
                    </div>
                  )}
                  
                  {stats.avg_communication && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.avg_communication.toFixed(1)}</div>
                      <StarDisplay rating={stats.avg_communication} size="sm" className="justify-center" />
                      <p className="text-xs text-gray-600 mt-1">Comunicação</p>
                    </div>
                  )}
                  
                  {stats.avg_professionalism && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.avg_professionalism.toFixed(1)}</div>
                      <StarDisplay rating={stats.avg_professionalism} size="sm" className="justify-center" />
                      <p className="text-xs text-gray-600 mt-1">Profissionalismo</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar avaliações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {[searchTerm, filterRating !== 'all', filterVerified, filterWithImages]
                      .filter(Boolean).length}
                  </Badge>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <SortDesc className="w-4 h-4" />
                      Mais recentes
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4" />
                      Mais antigas
                    </div>
                  </SelectItem>
                  <SelectItem value="highest">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Melhor avaliação
                    </div>
                  </SelectItem>
                  <SelectItem value="lowest">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Pior avaliação
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estrelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as avaliações</SelectItem>
                    <SelectItem value="5">5 estrelas</SelectItem>
                    <SelectItem value="4">4 estrelas</SelectItem>
                    <SelectItem value="3">3 estrelas</SelectItem>
                    <SelectItem value="2">2 estrelas</SelectItem>
                    <SelectItem value="1">1 estrela</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={filterVerified === true ? "default" : "outline"}
                  onClick={() => setFilterVerified(filterVerified === true ? null : true)}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verificadas
                </Button>

                <Button
                  variant={filterWithImages === true ? "default" : "outline"}
                  onClick={() => setFilterWithImages(filterWithImages === true ? null : true)}
                  className="justify-start"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Com fotos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ratings List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-48 h-6" />
                  <Skeleton className="w-full h-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : displayedRatings.length > 0 ? (
          displayedRatings.map((rating) => (
            <RatingCard
              key={rating.id}
              rating={rating}
              currentUserId={currentUserId}
              userRole={userRole}
              braiderId={braiderId}
              onEdit={onRatingEdit}
              onDelete={onRatingDelete}
              onReport={onRatingReport}
              onRespond={onRatingRespond}
              showBraiderActions={showBraiderActions}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? 'Nenhuma avaliação encontrada' : 'Ainda não há avaliações'}
              </h3>
              <p className="text-gray-600">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : `${braiderName} ainda não recebeu avaliações`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Load more */}
        {hasMore && displayedRatings.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => fetchRatings(false)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais avaliações'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
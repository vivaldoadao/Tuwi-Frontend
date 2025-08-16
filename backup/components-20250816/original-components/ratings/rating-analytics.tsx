'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StarDisplay, RatingBreakdown } from './star-rating'
import { 
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface RatingAnalyticsProps {
  braiderId?: string
  timeframe?: '7d' | '30d' | '90d' | 'all'
  showComparison?: boolean
  className?: string
}

interface AnalyticsData {
  // Current period
  totalRatings: number
  averageRating: number
  ratingDistribution: {
    rating_1_count: number
    rating_2_count: number
    rating_3_count: number
    rating_4_count: number
    rating_5_count: number
  }
  
  // Detailed averages
  avgQuality: number
  avgPunctuality: number
  avgCommunication: number
  avgProfessionalism: number
  
  // Trends
  ratingTrend: 'improving' | 'declining' | 'stable'
  trendPercentage: number
  
  // Recent activity
  recentRatings: number
  responseRate: number
  
  // Comparison (if previous period available)
  comparison?: {
    totalRatingsChange: number
    averageRatingChange: number
    trendChange: 'up' | 'down' | 'stable'
  }
}

export function RatingAnalytics({
  braiderId,
  timeframe = '30d',
  showComparison = true,
  className
}: RatingAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)

  useEffect(() => {
    loadAnalytics()
  }, [braiderId, selectedTimeframe])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, you'd call a specific analytics endpoint
      // For now, we'll simulate with the existing ratings API
      const params = new URLSearchParams({
        includeStats: 'true',
        limit: '1000' // Get more data for analytics
      })

      if (braiderId) {
        params.append('braiderId', braiderId)
      }

      const response = await fetch(`/api/ratings?${params}`)
      const result = await response.json()

      if (response.ok) {
        // Process the data to create analytics
        const processedData = processRatingsData(result.ratings || [], result.stats)
        setData(processedData)
      }

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processRatingsData = (ratings: any[], stats: any): AnalyticsData => {
    // Filter by timeframe
    const now = new Date()
    const timeframeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }

    const cutoffDate = selectedTimeframe === 'all' 
      ? new Date(0) 
      : new Date(now.getTime() - timeframeMs[selectedTimeframe])

    const filteredRatings = ratings.filter(rating => 
      new Date(rating.created_at) >= cutoffDate
    )

    // Calculate analytics
    const totalRatings = filteredRatings.length
    const averageRating = filteredRatings.length > 0 
      ? filteredRatings.reduce((sum, r) => sum + r.overall_rating, 0) / filteredRatings.length
      : 0

    // Rating distribution
    const ratingDistribution = {
      rating_1_count: filteredRatings.filter(r => r.overall_rating === 1).length,
      rating_2_count: filteredRatings.filter(r => r.overall_rating === 2).length,
      rating_3_count: filteredRatings.filter(r => r.overall_rating === 3).length,
      rating_4_count: filteredRatings.filter(r => r.overall_rating === 4).length,
      rating_5_count: filteredRatings.filter(r => r.overall_rating === 5).length,
    }

    // Calculate detailed averages
    const ratingsWithDetails = filteredRatings.filter(r => 
      r.quality_rating || r.punctuality_rating || r.communication_rating || r.professionalism_rating
    )

    const avgQuality = ratingsWithDetails.length > 0
      ? ratingsWithDetails.filter(r => r.quality_rating).reduce((sum, r) => sum + r.quality_rating, 0) 
        / ratingsWithDetails.filter(r => r.quality_rating).length || 0
      : 0

    const avgPunctuality = ratingsWithDetails.length > 0
      ? ratingsWithDetails.filter(r => r.punctuality_rating).reduce((sum, r) => sum + r.punctuality_rating, 0)
        / ratingsWithDetails.filter(r => r.punctuality_rating).length || 0
      : 0

    const avgCommunication = ratingsWithDetails.length > 0
      ? ratingsWithDetails.filter(r => r.communication_rating).reduce((sum, r) => sum + r.communication_rating, 0)
        / ratingsWithDetails.filter(r => r.communication_rating).length || 0
      : 0

    const avgProfessionalism = ratingsWithDetails.length > 0
      ? ratingsWithDetails.filter(r => r.professionalism_rating).reduce((sum, r) => sum + r.professionalism_rating, 0)
        / ratingsWithDetails.filter(r => r.professionalism_rating).length || 0
      : 0

    // Calculate trend
    const halfwayPoint = Math.floor(filteredRatings.length / 2)
    const firstHalf = filteredRatings.slice(0, halfwayPoint)
    const secondHalf = filteredRatings.slice(halfwayPoint)

    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, r) => sum + r.overall_rating, 0) / firstHalf.length 
      : 0
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, r) => sum + r.overall_rating, 0) / secondHalf.length 
      : 0

    let ratingTrend: 'improving' | 'declining' | 'stable' = 'stable'
    let trendPercentage = 0

    if (firstHalfAvg > 0) {
      const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      trendPercentage = Math.abs(change)
      
      if (change > 5) ratingTrend = 'improving'
      else if (change < -5) ratingTrend = 'declining'
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentRatings = filteredRatings.filter(r => new Date(r.created_at) >= sevenDaysAgo).length

    // Response rate (ratings with braider response)
    const ratingsWithResponse = filteredRatings.filter(r => r.braider_response).length
    const responseRate = totalRatings > 0 ? (ratingsWithResponse / totalRatings) * 100 : 0

    return {
      totalRatings,
      averageRating: Number(averageRating.toFixed(2)),
      ratingDistribution,
      avgQuality: Number(avgQuality.toFixed(2)),
      avgPunctuality: Number(avgPunctuality.toFixed(2)),
      avgCommunication: Number(avgCommunication.toFixed(2)),
      avgProfessionalism: Number(avgProfessionalism.toFixed(2)),
      ratingTrend,
      trendPercentage: Number(trendPercentage.toFixed(1)),
      recentRatings,
      responseRate: Number(responseRate.toFixed(1))
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics de Ratings</CardTitle>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Timeframe Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Analytics de Ratings</CardTitle>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div className="text-2xl font-bold">{data.totalRatings}</div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Total de Avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <div className="text-2xl font-bold">{data.averageRating}</div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Rating Médio</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.recentRatings}</div>
                <p className="text-xs text-gray-600">Últimos 7 dias</p>
              </div>
              <Calendar className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.responseRate}%</div>
                <p className="text-xs text-gray-600">Taxa de Resposta</p>
              </div>
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${getTrendColor(data.ratingTrend)}`}>
              <div className="flex items-center space-x-2">
                {getTrendIcon(data.ratingTrend)}
                <span className="font-medium capitalize">
                  {data.ratingTrend === 'improving' && 'Melhorando'}
                  {data.ratingTrend === 'declining' && 'Declinando'}
                  {data.ratingTrend === 'stable' && 'Estável'}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold">{data.trendPercentage}%</div>
                <div className="text-xs">vs período anterior</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <h4 className="font-medium">Atividade Recente</h4>
              <div className="flex items-center justify-between text-sm">
                <span>Novas avaliações (7 dias)</span>
                <Badge variant="secondary">{data.recentRatings}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Taxa de resposta</span>
                <Badge variant={data.responseRate > 70 ? "default" : "secondary"}>
                  {data.responseRate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingBreakdown 
              stats={{
                ...data.ratingDistribution,
                total_ratings: data.totalRatings
              }} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ratings Analysis */}
      {(data.avgQuality > 0 || data.avgPunctuality > 0 || data.avgCommunication > 0 || data.avgProfessionalism > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avaliações por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.avgQuality > 0 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.avgQuality}</div>
                  <StarDisplay rating={data.avgQuality} size="sm" className="justify-center mt-1" />
                  <p className="text-xs text-blue-700 mt-1">Qualidade</p>
                </div>
              )}
              
              {data.avgPunctuality > 0 && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{data.avgPunctuality}</div>
                  <StarDisplay rating={data.avgPunctuality} size="sm" className="justify-center mt-1" />
                  <p className="text-xs text-green-700 mt-1">Pontualidade</p>
                </div>
              )}
              
              {data.avgCommunication > 0 && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{data.avgCommunication}</div>
                  <StarDisplay rating={data.avgCommunication} size="sm" className="justify-center mt-1" />
                  <p className="text-xs text-purple-700 mt-1">Comunicação</p>
                </div>
              )}
              
              {data.avgProfessionalism > 0 && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data.avgProfessionalism}</div>
                  <StarDisplay rating={data.avgProfessionalism} size="sm" className="justify-center mt-1" />
                  <p className="text-xs text-orange-700 mt-1">Profissionalismo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.averageRating >= 4.5 && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Excelente Performance!</div>
                  <div className="text-sm text-green-700">Você mantém um rating excepcional de {data.averageRating} estrelas</div>
                </div>
              </div>
            )}

            {data.ratingTrend === 'improving' && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Tendência Positiva</div>
                  <div className="text-sm text-blue-700">Seus ratings melhoraram {data.trendPercentage}% recentemente</div>
                </div>
              </div>
            )}

            {data.responseRate < 50 && data.totalRatings > 5 && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">Melhore a Interação</div>
                  <div className="text-sm text-yellow-700">Responder às avaliações aumenta a confiança dos clientes</div>
                </div>
              </div>
            )}

            {data.recentRatings === 0 && selectedTimeframe === '30d' && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Sem Avaliações Recentes</div>
                  <div className="text-sm text-gray-700">Incentive seus clientes a deixarem feedback após os serviços</div>
                </div>
              </div>
            )}

            {data.totalRatings > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">Continue Assim!</div>
                  <div className="text-sm text-purple-700">Você já possui {data.totalRatings} avaliações. Ótimo trabalho!</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
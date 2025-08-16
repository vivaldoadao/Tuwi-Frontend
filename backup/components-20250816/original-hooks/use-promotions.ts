import { useState, useEffect } from 'react'

export interface PromotedBraider {
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

export interface HeroBannerPromotion {
  id: string
  title: string
  content_data: {
    title: string
    subtitle: string
    description: string
    imageUrl: string
    ctaText: string
    ctaLink: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
  }
  user_id: string
  start_date: string
  end_date: string
  views_count: number
  clicks_count: number
}

export interface UsePromotionsOptions {
  type?: 'hero' | 'braiders'
  location?: string
  specialty?: string
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UsePromotionsResult {
  // Para banner hero
  heroBanner: HeroBannerPromotion | null
  
  // Para braiders promovidos
  promotedBraiders: PromotedBraider[]
  regularBraiders: any[]
  
  // Estados
  loading: boolean
  error: string | null
  
  // Funções
  refresh: () => Promise<void>
  trackClick: (promotionId: string, metadata?: any) => Promise<void>
  
  // Informações úteis
  hasPromotions: boolean
  total: number
}

export function usePromotions(options: UsePromotionsOptions = {}): UsePromotionsResult {
  const {
    type = 'braiders',
    location,
    specialty,
    limit = 20,
    autoRefresh = false,
    refreshInterval = 60000 // 1 minuto
  } = options

  const [heroBanner, setHeroBanner] = useState<HeroBannerPromotion | null>(null)
  const [promotedBraiders, setPromotedBraiders] = useState<PromotedBraider[]>([])
  const [regularBraiders, setRegularBraiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchData = async () => {
    try {
      setError(null)
      
      if (type === 'hero') {
        const response = await fetch('/api/promotions/public?type=hero')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setHeroBanner(data.hero_banner)
        
      } else if (type === 'braiders') {
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
        setRegularBraiders(data.regular_braiders || [])
        setTotal(data.total || 0)
      }

    } catch (err) {
      console.error('Error fetching promotions:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar promoções')
    } finally {
      setLoading(false)
    }
  }

  const trackClick = async (promotionId: string, metadata: any = {}) => {
    try {
      await fetch('/api/promotions/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: promotionId,
          action: 'click',
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        })
      })
    } catch (error) {
      console.error('Error tracking click:', error)
      // Não propagar erro para não quebrar a UI
    }
  }

  // Fetch inicial
  useEffect(() => {
    fetchData()
  }, [type, location, specialty, limit])

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, type, location, specialty, limit])

  const hasPromotions = type === 'hero' 
    ? !!heroBanner 
    : promotedBraiders.length > 0

  return {
    // Dados
    heroBanner,
    promotedBraiders,
    regularBraiders,
    
    // Estados
    loading,
    error,
    
    // Funções
    refresh: fetchData,
    trackClick,
    
    // Informações úteis
    hasPromotions,
    total
  }
}

// Hook especializado para banner hero
export function useHeroBanner(autoRefresh = false) {
  return usePromotions({ 
    type: 'hero', 
    autoRefresh,
    refreshInterval: 30000 // 30 segundos para banner
  })
}

// Hook especializado para braiders promovidos
export function usePromotedBraiders(options: {
  location?: string
  specialty?: string
  limit?: number
  autoRefresh?: boolean
} = {}) {
  return usePromotions({ 
    type: 'braiders', 
    ...options,
    refreshInterval: 60000 // 1 minuto para braiders
  })
}


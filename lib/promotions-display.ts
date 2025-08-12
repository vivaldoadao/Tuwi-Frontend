import { createServerClient } from '@supabase/ssr'
import { getAllBraidersLegacy } from '@/lib/data-supabase'

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
  // Campos de localização detalhada
  district?: string
  concelho?: string
  freguesia?: string
  promotion: {
    id: string
    type: 'profile_highlight' | 'hero_banner' | 'combo_package'
    start_date: string
    end_date: string
    views_count: number
    clicks_count: number
    content_data: any
    metadata?: any
  }
}

export interface HeroBannerPromotion {
  id: string
  title: string
  type: 'hero_banner'
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

// Criar cliente Supabase para server-side
function createSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {}
      }
    }
  )
}

/**
 * Buscar perfis de trancistas com destaque ativo
 * Retorna primeiro os perfis promovidos, depois os normais
 */
export async function getBraidersWithPromotions(options: {
  limit?: number
  location?: string
  specialty?: string
  includeFree?: boolean
} = {}): Promise<{ 
  promoted: PromotedBraider[]
  regular: any[]
  total: number 
}> {
  try {
    const supabase = createSupabaseClient()
    const { limit = 20, location, specialty, includeFree = true } = options

    // 1. Buscar todas as trancistas usando a função existente
    const allBraiders = await getAllBraidersLegacy()
    console.log('Found braiders:', allBraiders.length)

    // 2. Buscar promoções ativas do tipo profile_highlight ou combo
    const { data: activePromotions } = await supabase
      .from('promotions')
      .select(`
        id,
        user_id,
        type,
        start_date,
        end_date,
        views_count,
        clicks_count,
        content_data,
        metadata
      `)
      .eq('status', 'active')
      .in('type', ['profile_highlight', 'combo_package'])
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })

    console.log('Found active promotions:', activePromotions?.length || 0)

    const promotedUserIds = activePromotions?.map(p => p.user_id) || []

    // 3. Aplicar filtros nas trancistas
    let filteredBraiders = allBraiders

    if (location) {
      filteredBraiders = filteredBraiders.filter(braider => 
        braider.location?.toLowerCase().includes(location.toLowerCase())
      )
    }

    if (specialty) {
      filteredBraiders = filteredBraiders.filter(braider => 
        braider.specialties?.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
      )
    }

    // 4. Separar promovidas das regulares
    const promotedBraiders: PromotedBraider[] = []
    const regularBraiders: any[] = []

    filteredBraiders.forEach(braider => {
      const promotion = activePromotions?.find(p => p.user_id === braider.user_id)
      
      if (promotion) {
        // Trancista tem promoção ativa
        promotedBraiders.push({
          id: braider.id,
          name: braider.name,
          email: braider.email || braider.contactEmail,
          profileImageUrl: braider.profileImageUrl,
          location: braider.location,
          specialties: braider.specialties || [],
          rating: braider.averageRating,
          reviewCount: braider.totalReviews,
          verified: braider.isVerified || false,
          // Campos de localização detalhada
          district: braider.district,
          concelho: braider.concelho,
          freguesia: braider.freguesia,
          promotion: {
            id: promotion.id,
            type: promotion.type,
            start_date: promotion.start_date,
            end_date: promotion.end_date,
            views_count: promotion.views_count,
            clicks_count: promotion.clicks_count,
            content_data: promotion.content_data,
            metadata: promotion.metadata
          }
        })
      } else {
        // Trancista regular
        regularBraiders.push({
          id: braider.id,
          name: braider.name,
          email: braider.email || braider.contactEmail,
          profileImageUrl: braider.profileImageUrl,
          location: braider.location,
          specialties: braider.specialties || [],
          rating: braider.averageRating,
          reviewCount: braider.totalReviews,
          verified: braider.isVerified || false,
          // Campos de localização detalhada
          district: braider.district,
          concelho: braider.concelho,
          freguesia: braider.freguesia
        })
      }
    })

    // 5. Aplicar limite
    const finalPromoted = promotedBraiders.slice(0, limit)
    const remainingLimit = Math.max(0, limit - finalPromoted.length)
    const finalRegular = regularBraiders.slice(0, remainingLimit)

    // 6. Incrementar views das promoções visualizadas
    if (finalPromoted.length > 0) {
      await Promise.all(
        finalPromoted.map(braider => 
          incrementPromotionView(braider.promotion.id)
        )
      )
    }

    console.log('Returning:', finalPromoted.length, 'promoted,', finalRegular.length, 'regular')

    return {
      promoted: finalPromoted,
      regular: finalRegular,
      total: finalPromoted.length + finalRegular.length
    }

  } catch (error) {
    console.error('Error fetching braiders with promotions:', error)
    
    // Em caso de erro, usar apenas as trancistas existentes
    try {
      const fallbackBraiders = await getAllBraidersLegacy()
      const limitedBraiders = fallbackBraiders.slice(0, options.limit || 20)
      
      return {
        promoted: [],
        regular: limitedBraiders.map(braider => ({
          id: braider.id,
          name: braider.name,
          email: braider.email || braider.contactEmail,
          profileImageUrl: braider.profileImageUrl,
          location: braider.location,
          specialties: braider.specialties || [],
          rating: braider.averageRating,
          reviewCount: braider.totalReviews,
          verified: braider.isVerified || false
        })),
        total: limitedBraiders.length
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError)
      return {
        promoted: [],
        regular: [],
        total: 0
      }
    }
  }
}

/**
 * Buscar banner hero ativo para a homepage
 */
export async function getActiveHeroBanner(): Promise<HeroBannerPromotion | null> {
  try {
    const supabase = createSupabaseClient()
    
    const { data: heroBanner } = await supabase
      .from('promotions')
      .select(`
        id,
        title,
        type,
        content_data,
        user_id,
        start_date,
        end_date,
        views_count,
        clicks_count
      `)
      .eq('status', 'active')
      .eq('type', 'hero_banner')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (heroBanner) {
      // Incrementar view do banner
      await incrementPromotionView(heroBanner.id)
      
      return {
        id: heroBanner.id,
        title: heroBanner.title,
        type: 'hero_banner',
        content_data: heroBanner.content_data,
        user_id: heroBanner.user_id,
        start_date: heroBanner.start_date,
        end_date: heroBanner.end_date,
        views_count: heroBanner.views_count,
        clicks_count: heroBanner.clicks_count
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching hero banner:', error)
    return null
  }
}

/**
 * Incrementar contador de visualização da promoção
 */
export async function incrementPromotionView(promotionId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Tentar usar a função RPC primeiro
    const { error: rpcError } = await supabase
      .rpc('increment_promotion_counter', {
        promotion_id: promotionId,
        field_name: 'views_count'
      })

    if (rpcError) {
      console.warn('RPC function not available, using direct update:', rpcError.message)
      
      // Fallback para update direto
      await supabase
        .from('promotions')
        .update({ 
          views_count: supabase.sql`views_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionId)
    }

  } catch (error) {
    console.error('Error incrementing promotion view:', error)
    // Não propagar erro para não quebrar a busca principal
  }
}

/**
 * Registrar clique em promoção
 */
export async function trackPromotionClick(promotionId: string, metadata?: any): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Incrementar contador de cliques
    const { error: rpcError } = await supabase
      .rpc('increment_promotion_counter', {
        promotion_id: promotionId,
        field_name: 'clicks_count'
      })

    if (rpcError) {
      // Fallback
      await supabase
        .from('promotions')
        .update({ 
          clicks_count: supabase.sql`clicks_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionId)
    }

    // Registrar evento detalhado de analytics (opcional)
    await supabase
      .from('promotion_analytics')
      .insert({
        promotion_id: promotionId,
        event_type: 'click',
        data: metadata || {},
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error tracking promotion click:', error)
  }
}

/**
 * Buscar configurações ativas do sistema de promoções
 */
export async function getPromotionSettings() {
  try {
    const supabase = createSupabaseClient()
    
    const { data: settings } = await supabase
      .from('promotion_settings')
      .select('key, value')
      .in('key', ['system_enabled', 'max_hero_banners', 'max_highlighted_profiles'])

    const settingsMap: { [key: string]: any } = {}
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    return {
      system_enabled: settingsMap.system_enabled === true,
      max_hero_banners: settingsMap.max_hero_banners || 1,
      max_highlighted_profiles: settingsMap.max_highlighted_profiles || 10
    }
  } catch (error) {
    console.error('Error fetching promotion settings:', error)
    return {
      system_enabled: false,
      max_hero_banners: 1,
      max_highlighted_profiles: 10
    }
  }
}
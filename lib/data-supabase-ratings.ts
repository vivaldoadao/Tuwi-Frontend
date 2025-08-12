/**
 * FASE 2: Funções de dados com ratings reais do banco de dados
 * 
 * Este arquivo estende data-supabase.ts com funções que utilizam
 * ratings reais ao invés de dados mock
 */

import { createClient } from '@/lib/supabase/client'
import type { Braider, Product } from './data-supabase'

const supabase = createClient()

// ============================================================================
// TYPES ESTENDIDOS COM RATINGS REAIS
// ============================================================================

export type BraiderWithRealRating = Braider & {
  averageRating: number
  totalReviews: number
  isAvailable: boolean
  ratingDistribution?: Record<string, number>
}

export type ProductWithRealRating = Product & {
  averageRating: number
  totalReviews: number
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  isInStock: boolean
  verifiedReviews?: number
  helpfulVotes?: number
}

// ============================================================================
// BRAIDER FUNCTIONS COM RATINGS REAIS
// ============================================================================

/**
 * Obter todos os braiders com ratings calculados em tempo real
 */
export async function getAllBraidersWithRealRatings(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = 'approved'
): Promise<{ braiders: BraiderWithRealRating[], total: number, hasMore: boolean }> {
  try {
    console.log('🔍 Fetching braiders with real ratings...', { page, limit, search, status })

    // Use a view materializada para performance
    let query = supabase
      .from('braiders_with_stats')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`user_name.ilike.%${search}%,location.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error fetching braiders with ratings:', error)
      return { braiders: [], total: 0, hasMore: false }
    }

    const braiders: BraiderWithRealRating[] = (data || []).map(braider => ({
      id: braider.id,
      name: braider.user_name || `Trancista ${braider.id.slice(0, 8)}`,
      bio: braider.bio || '',
      location: braider.location || 'Localização não informada',
      contactEmail: braider.user_email || 'email-nao-disponivel@exemplo.com',
      contactPhone: braider.contact_phone || '',
      profileImageUrl: braider.avatar_url || '/placeholder.svg?height=200&width=200&text=T',
      services: [], // Carregado separadamente se necessário
      portfolioImages: braider.portfolio_images || [],
      status: braider.status || 'pending',
      
      // DADOS REAIS DO BANCO (não mais mock!)
      averageRating: parseFloat(braider.average_rating || '0'),
      totalReviews: parseInt(braider.total_reviews || '0'),
      isAvailable: braider.is_available || false,
      
      createdAt: braider.created_at || new Date().toISOString()
    }))

    const total = count || 0
    const hasMore = (page * limit) < total

    console.log(`✅ Found ${braiders.length} braiders with real ratings`)

    return { braiders, total, hasMore }
  } catch (error) {
    console.error('❌ Unexpected error fetching braiders with ratings:', error)
    return { braiders: [], total: 0, hasMore: false }
  }
}

/**
 * Obter braider específico com ratings reais
 */
export async function getBraiderWithRealRating(id: string): Promise<BraiderWithRealRating | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_braider_with_stats', { braider_uuid: id })
      .single()

    if (error) {
      console.error('❌ Error fetching braider with rating:', error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      name: data.user_name || `Trancista ${data.id.slice(0, 8)}`,
      bio: data.bio || '',
      location: data.location || 'Localização não informada',
      contactEmail: data.user_email || 'email-nao-disponivel@exemplo.com',
      contactPhone: data.contact_phone || '',
      profileImageUrl: data.avatar_url || '/placeholder.svg?height=200&width=200&text=T',
      services: [], // Carregado separadamente se necessário
      portfolioImages: data.portfolio_images || [],
      status: data.status || 'pending',
      
      // DADOS REAIS DO BANCO
      averageRating: parseFloat(data.average_rating || '0'),
      totalReviews: parseInt(data.total_reviews || '0'),
      isAvailable: data.is_available || false,
      
      createdAt: data.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Unexpected error fetching braider with rating:', error)
    return null
  }
}

/**
 * Obter estatísticas detalhadas de rating de um braider
 */
export async function getBraiderRatingStats(braiderId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_braider_rating_stats', { braider_uuid: braiderId })
      .single()

    if (error) {
      console.error('❌ Error fetching braider rating stats:', error)
      return null
    }

    return {
      averageRating: parseFloat(data?.average_rating || '0'),
      totalReviews: parseInt(data?.total_reviews || '0'),
      isAvailable: data?.is_available || false,
      ratingDistribution: data?.rating_distribution || {}
    }
  } catch (error) {
    console.error('❌ Unexpected error fetching braider rating stats:', error)
    return null
  }
}

// ============================================================================
// PRODUCT FUNCTIONS COM RATINGS REAIS
// ============================================================================

/**
 * Obter todos os produtos com ratings calculados em tempo real
 */
export async function getAllProductsWithRealRatings(
  page: number = 1,
  limit: number = 20
): Promise<{ products: ProductWithRealRating[], total: number, hasMore: boolean }> {
  try {
    console.log('🔍 Fetching products with real ratings...', { page, limit })

    // Use a view materializada para performance
    let query = supabase
      .from('products_with_stats')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error fetching products with ratings:', error)
      return { products: [], total: 0, hasMore: false }
    }

    const products: ProductWithRealRating[] = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images?.[0] || '/placeholder.svg',
      description: product.description || '',
      longDescription: product.long_description || '',
      
      // DADOS REAIS DO BANCO (não mais mock!)
      averageRating: parseFloat(product.average_rating || '0'),
      totalReviews: parseInt(product.total_reviews || '0'),
      stockStatus: product.stock_status as 'in_stock' | 'low_stock' | 'out_of_stock',
      isInStock: product.is_in_stock || false
    }))

    const total = count || 0
    const hasMore = (page * limit) < total

    console.log(`✅ Found ${products.length} products with real ratings`)

    return { products, total, hasMore }
  } catch (error) {
    console.error('❌ Unexpected error fetching products with ratings:', error)
    return { products: [], total: 0, hasMore: false }
  }
}

/**
 * Obter produto específico com ratings reais
 */
export async function getProductWithRealRating(id: string): Promise<ProductWithRealRating | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_product_with_stats', { product_uuid: id })
      .single()

    if (error) {
      console.error('❌ Error fetching product with rating:', error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      price: parseFloat(data.price),
      imageUrl: data.images?.[0] || '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || '',
      
      // DADOS REAIS DO BANCO
      averageRating: parseFloat(data.average_rating || '0'),
      totalReviews: parseInt(data.total_reviews || '0'),
      stockStatus: data.stock_status as 'in_stock' | 'low_stock' | 'out_of_stock',
      isInStock: data.is_in_stock || false
    }
  } catch (error) {
    console.error('❌ Unexpected error fetching product with rating:', error)
    return null
  }
}

/**
 * Obter estatísticas detalhadas de rating de um produto
 */
export async function getProductRatingStats(productId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_product_rating_stats', { product_uuid: productId })
      .single()

    if (error) {
      console.error('❌ Error fetching product rating stats:', error)
      return null
    }

    return {
      averageRating: parseFloat(data?.average_rating || '0'),
      totalReviews: parseInt(data?.total_reviews || '0'),
      ratingDistribution: data?.rating_distribution || {},
      verifiedReviews: parseInt(data?.verified_reviews || '0'),
      helpfulVotes: parseInt(data?.helpful_votes || '0')
    }
  } catch (error) {
    console.error('❌ Unexpected error fetching product rating stats:', error)
    return null
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Refresh das views materializadas (para usar após mudanças massivas)
 */
export async function refreshRatingViews() {
  try {
    const { error } = await supabase.rpc('refresh_rating_views')
    
    if (error) {
      console.error('❌ Error refreshing rating views:', error)
      return false
    }

    console.log('✅ Rating views refreshed successfully')
    return true
  } catch (error) {
    console.error('❌ Unexpected error refreshing rating views:', error)
    return false
  }
}

/**
 * Verificar se o sistema de ratings está funcionando
 */
export async function testRatingSystem() {
  try {
    console.log('🧪 Testing rating system...')

    // Test braider ratings
    const { braiders } = await getAllBraidersWithRealRatings(1, 1)
    console.log('✅ Braider ratings:', braiders[0]?.averageRating, braiders[0]?.totalReviews)

    // Test product ratings  
    const { products } = await getAllProductsWithRealRatings(1, 1)
    console.log('✅ Product ratings:', products[0]?.averageRating, products[0]?.totalReviews)

    return {
      success: true,
      braidersWithRatings: braiders.length,
      productsWithRatings: products.length
    }
  } catch (error) {
    console.error('❌ Rating system test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
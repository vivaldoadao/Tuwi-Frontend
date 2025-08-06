// Client-side API functions for calling our Next.js API routes

export type BraiderAdmin = {
  id: string
  name: string
  bio: string
  location: string
  contactEmail: string
  contactPhone: string
  profileImageUrl: string
  whatsapp?: string
  instagram?: string
  district?: string
  concelho?: string
  freguesia?: string
  address?: string
  postalCode?: string
  servesHome?: boolean
  servesStudio?: boolean
  servesSalon?: boolean
  maxTravelDistance?: number
  salonName?: string
  salonAddress?: string
  specialties?: string[]
  yearsExperience?: string
  certificates?: string
  minPrice?: number
  maxPrice?: number
  availability?: any
  services?: any[]
  portfolioImages?: string[]
  status: 'pending' | 'approved' | 'rejected'
  averageRating?: number
  totalReviews?: number
  createdAt: string
  userId?: string
}

/**
 * Fetch braiders for admin dashboard
 */
export async function fetchBraidersAdmin(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string
): Promise<{ braiders: BraiderAdmin[], total: number, hasMore: boolean }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && status !== 'all' && { status })
    })

    const response = await fetch(`/api/admin/braiders-list?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar trancistas')
    }

    const data = await response.json()
    return {
      braiders: data.braiders || [],
      total: data.total || 0,
      hasMore: data.hasMore || false
    }
  } catch (error) {
    console.error('Error fetching braiders:', error)
    throw error
  }
}

/**
 * Fetch single braider by ID for admin
 */
export async function fetchBraiderByIdAdmin(braiderId: string): Promise<BraiderAdmin> {
  try {
    const response = await fetch(`/api/admin/braiders/${braiderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar trancista')
    }

    const data = await response.json()
    return data.braider
  } catch (error) {
    console.error('Error fetching braider by ID:', error)
    throw error
  }
}

/**
 * Update braider status
 */
export async function updateBraiderStatusAdmin(
  braiderId: string,
  status: 'pending' | 'approved' | 'rejected',
  reason?: string
): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch(`/api/admin/braiders/${braiderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        reason
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar status')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating braider status:', error)
    throw error
  }
}

import type { ProductAdmin } from '@/lib/data-supabase'

export type { ProductAdmin } from '@/lib/data-supabase'

/**
 * Fetch all products for admin dashboard
 */
export async function getAllProductsAdminSecureClient(
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string
): Promise<{ products: ProductAdmin[], total: number, hasMore: boolean }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category })
    })

    const response = await fetch(`/api/admin/products?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar produtos')
    }

    const data = await response.json()
    return {
      products: data.products || [],
      total: data.total || 0,
      hasMore: data.hasMore || false
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Create new product
 */
export async function createProductSecure(productData: Omit<ProductAdmin, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, message: string, product?: ProductAdmin }> {
  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar produto')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Update existing product
 */
export async function updateProductSecure(productId: string, productData: Partial<ProductAdmin>): Promise<{ success: boolean, message: string, product?: ProductAdmin }> {
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar produto')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

/**
 * Toggle product status (active/inactive)
 */
export async function toggleProductStatusSecure(productId: string): Promise<{ success: boolean, error?: string, isActive?: boolean }> {
  try {
    const response = await fetch(`/api/admin/products/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Erro ao alterar status do produto' }
    }

    const data = await response.json()
    return { success: true, isActive: data.isActive }
  } catch (error) {
    console.error('Error toggling product status:', error)
    return { success: false, error: 'Erro de conexão ao alterar status do produto' }
  }
}

/**
 * Delete product
 */
export async function deleteProductSecure(productId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Erro ao deletar produto' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Erro de conexão ao deletar produto' }
  }
}

/**
 * Get single product by ID for admin
 */
export async function getProductByIdSecure(productId: string): Promise<{ product?: ProductAdmin, error?: string }> {
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Erro ao buscar produto' }
    }

    const data = await response.json()
    return { product: data.product }
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return { error: 'Erro de conexão ao buscar produto' }
  }
}

export async function registerBraider(braiderData: {
  name: string
  bio: string
  location: string
  contactEmail: string
  contactPhone: string
  profileImageUrl?: string
  whatsapp?: string
  instagram?: string
  district?: string
  concelho?: string
  freguesia?: string
  address?: string
  postalCode?: string
  servesHome?: boolean
  servesStudio?: boolean
  servesSalon?: boolean
  maxTravelDistance?: number
  salonName?: string
  salonAddress?: string
  specialties?: string[]
  yearsExperience?: string
  certificates?: string
  minPrice?: number
  maxPrice?: number
  availability?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}): Promise<{ success: boolean; message: string; braider?: any }> {
  try {
    const response = await fetch('/api/braiders/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(braiderData),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Erro na comunicação com o servidor'
      }
    }
    
    return result
  } catch (error) {
    console.error('Error calling braider registration API:', error)
    return {
      success: false,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
  }
}
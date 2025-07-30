/**
 * Client-side API functions for admin operations
 * Uses secure API routes instead of direct Supabase calls
 */

import type { ProductAdmin } from './data-supabase'

export async function createProductSecure(productData: {
  name: string
  description: string
  longDescription?: string
  price: number
  category: string
  stockQuantity: number
  images?: string[]
}): Promise<{ success: boolean, error?: string, productId?: string }> {
  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Erro ao criar produto' }
    }

    return result
  } catch (error) {
    console.error('Error calling create product API:', error)
    return { success: false, error: 'Erro de conexão ao criar produto' }
  }
}

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
    })
    
    if (search) params.append('search', search)
    if (category && category !== 'all') params.append('category', category)

    const response = await fetch(`/api/admin/products?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    return { products: [], total: 0, hasMore: false }
  }
}

export async function updateProductSecure(
  productId: string,
  productData: {
    name?: string
    description?: string
    longDescription?: string
    price?: number
    category?: string
    stockQuantity?: number
    images?: string[]
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    const response = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, ...productData }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Erro ao atualizar produto' }
    }

    return result
  } catch (error) {
    console.error('Error calling update product API:', error)
    return { success: false, error: 'Erro de conexão ao atualizar produto' }
  }
}

export async function toggleProductStatusSecure(
  productId: string
): Promise<{ success: boolean, error?: string, isActive?: boolean }> {
  try {
    const response = await fetch('/api/admin/products/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Erro ao alterar status do produto' }
    }

    return result
  } catch (error) {
    console.error('Error calling toggle product status API:', error)
    return { success: false, error: 'Erro de conexão ao alterar status' }
  }
}

export async function deleteProductSecure(
  productId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    const response = await fetch(`/api/admin/products?id=${productId}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Erro ao excluir produto' }
    }

    return result
  } catch (error) {
    console.error('Error calling delete product API:', error)
    return { success: false, error: 'Erro de conexão ao excluir produto' }
  }
}

export async function getProductByIdSecure(
  productId: string
): Promise<{ product: ProductAdmin | null, error?: string }> {
  try {
    const response = await fetch(`/api/admin/products/${productId}`)
    
    if (!response.ok) {
      const result = await response.json()
      return { product: null, error: result.error || 'Erro ao buscar produto' }
    }

    const result = await response.json()
    return { product: result.product, error: undefined }
  } catch (error) {
    console.error('Error calling get product API:', error)
    return { product: null, error: 'Erro de conexão ao buscar produto' }
  }
}
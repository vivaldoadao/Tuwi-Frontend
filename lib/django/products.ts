/**
 * Django Products API - responsável apenas pelas operações de produtos
 */

import { apiCall, DjangoPaginatedResponse } from './base'
import type { DjangoProductAdmin, DjangoCategory, ProductAdmin } from './types'

// ============================================================================
// PRODUCTS API
// ============================================================================

/**
 * Get all products for admin dashboard with pagination and filters
 */
export async function getAllProductsAdminDjango(
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string
): Promise<{ products: ProductAdmin[], total: number, hasMore: boolean }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    })

    const response = await apiCall<DjangoPaginatedResponse<DjangoProductAdmin>>(
      `/admin/products/?${params}`
    )

    return {
      products: response.results.map(convertDjangoProductToProductAdmin),
      total: response.count,
      hasMore: !!response.next
    }
  } catch (error) {
    console.error('Error fetching products from Django:', error)
    throw error
  }
}

/**
 * Get single product by ID for admin
 */
export async function getProductByIdDjango(productId: string): Promise<ProductAdmin> {
  try {
    const response = await apiCall<DjangoProductAdmin>(`/admin/products/${productId}/`)
    return convertDjangoProductToProductAdmin(response)
  } catch (error) {
    console.error('Error fetching product by ID from Django:', error)
    throw error
  }
}

/**
 * Toggle product status (active/inactive)
 */
export async function toggleProductStatusDjango(
  productId: string
): Promise<{ success: boolean; isActive: boolean; message: string }> {
  try {
    const response = await apiCall<{ success: boolean; is_active: boolean; message: string }>(
      `/admin/products/${productId}/toggle-status/`,
      { method: 'PATCH' }
    )

    return {
      success: response.success,
      isActive: response.is_active,
      message: response.message
    }
  } catch (error) {
    console.error('Error toggling product status:', error)
    throw new Error('Erro ao alterar status do produto')
  }
}

/**
 * Bulk operations for products
 */
export async function bulkOperationsProductsDjango(
  action: 'bulk_activate' | 'bulk_deactivate' | 'bulk_delete',
  productIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    return await apiCall<{ success: boolean; message: string }>(
      '/admin/products/bulk-operations/',
      {
        method: 'POST',
        body: JSON.stringify({
          action,
          product_ids: productIds
        })
      }
    )
  } catch (error) {
    console.error('Error performing bulk operations:', error)
    throw error
  }
}

/**
 * Delete single product
 */
export async function deleteProductDjango(productId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await bulkOperationsProductsDjango('bulk_delete', [productId])
    return {
      success: result.success,
      ...(result.message && { message: result.message })
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return {
      success: false,
      message: 'Erro ao excluir produto'
    }
  }
}

/**
 * Create new product
 */
export async function createProductDjango(productData: {
  name: string
  description?: string
  short_description?: string
  category?: string
  price: number
  sale_price?: number
  cost_price?: number
  sku?: string
  stock_quantity?: number
  low_stock_threshold?: number
  track_inventory?: boolean
  allow_backorder?: boolean
  weight?: number
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  meta_title?: string
  meta_description?: string
  is_active?: boolean
  is_featured?: boolean
  is_digital?: boolean
  requires_shipping?: boolean
}): Promise<{ success: boolean; product?: DjangoProductAdmin; message: string }> {
  try {
    // Generate slug from name with unique suffix to avoid duplicates
    const baseSlug = productData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
    
    // Add timestamp and random suffix to ensure uniqueness
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const slug = `${baseSlug}-${uniqueSuffix}`

    // Generate SKU if not provided
    const sku = productData.sku || `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    
    // Prepare payload with proper field mapping
    const payload = {
      ...productData,
      slug,
      sku,
      description: productData.description || productData.short_description || `Descrição do produto ${productData.name}`,
      short_description: productData.description || productData.short_description || '',
      is_active: productData.is_active ?? true,
      track_inventory: productData.track_inventory ?? true,
      requires_shipping: productData.requires_shipping ?? true,
      stock_quantity: productData.stock_quantity ?? 0,
      low_stock_threshold: productData.low_stock_threshold ?? 5
    }
    
    console.log('[CreateProduct] Payload being sent to Django:', JSON.stringify(payload, null, 2))
    
    const response = await apiCall<DjangoProductAdmin>('/products/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    return {
      success: true,
      product: response,
      message: 'Produto criado com sucesso'
    }
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Update existing product
 */
export async function updateProductDjango(
  productSlug: string,
  productData: Partial<DjangoProductAdmin>
): Promise<{ success: boolean; product?: DjangoProductAdmin; message: string }> {
  try {
    const response = await apiCall<DjangoProductAdmin>(`/products/${productSlug}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    })
    
    return {
      success: true,
      product: response,
      message: 'Produto atualizado com sucesso'
    }
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// ============================================================================
// CATEGORIES API
// ============================================================================

/**
 * Get all categories for admin dropdown
 */
export async function getProductCategoriesDjango(): Promise<string[]> {
  try {
    const response = await apiCall<DjangoCategory[]>('/admin/categories/')
    return response.map(category => category.name)
  } catch (error) {
    console.error('Error fetching categories from Django:', error)
    throw error
  }
}

/**
 * Get all categories with full details for admin management
 */
export async function getProductCategoriesDetailedDjango(): Promise<DjangoCategory[]> {
  try {
    return await apiCall<DjangoCategory[]>('/admin/categories/')
  } catch (error) {
    console.error('Error fetching detailed categories from Django:', error)
    throw error
  }
}

/**
 * Create new category
 */
export async function createCategoryDjango(categoryData: {
  name: string
  slug?: string
  description?: string
  parent?: string | null
  sort_order?: number
}): Promise<{ success: boolean; category?: DjangoCategory; message: string }> {
  try {
    const response = await apiCall<DjangoCategory>('/admin/categories/', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    })
    
    return {
      success: true,
      category: response,
      message: 'Categoria criada com sucesso'
    }
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Update existing category
 */
export async function updateCategoryDjango(
  categoryId: string, 
  categoryData: Partial<DjangoCategory>
): Promise<{ success: boolean; category?: DjangoCategory; message: string }> {
  try {
    const response = await apiCall<DjangoCategory>(`/admin/categories/${categoryId}/`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData)
    })
    
    return {
      success: true,
      category: response,
      message: 'Categoria atualizada com sucesso'
    }
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

/**
 * Toggle category status (active/inactive)
 */
export async function toggleCategoryStatusDjango(
  categoryId: string
): Promise<{ success: boolean; isActive: boolean; message: string }> {
  try {
    const response = await apiCall<{ success: boolean; is_active: boolean; message: string }>(
      `/admin/categories/${categoryId}/toggle-status/`,
      { method: 'PATCH' }
    )

    return {
      success: response.success,
      isActive: response.is_active,
      message: response.message
    }
  } catch (error) {
    console.error('Error toggling category status:', error)
    throw new Error('Erro ao alterar status da categoria')
  }
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategoryDjango(
  categoryId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await apiCall<{ success: boolean; message: string }>(
      `/admin/categories/${categoryId}/`,
      { method: 'DELETE' }
    )
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert Django product to frontend ProductAdmin format
 */
export function convertDjangoProductToProductAdmin(djangoProduct: DjangoProductAdmin | any): ProductAdmin {
  // Handle category field - it might be an object (detail view) or string (list view)
  let categoryName: string
  if (typeof djangoProduct.category === 'object' && djangoProduct.category?.name) {
    categoryName = djangoProduct.category.name
  } else if (djangoProduct.category_name) {
    categoryName = djangoProduct.category_name
  } else if (typeof djangoProduct.category === 'string') {
    categoryName = djangoProduct.category
  } else {
    categoryName = 'Sem categoria'
  }

  return {
    id: djangoProduct.id,
    name: djangoProduct.name,
    description: djangoProduct.short_description || djangoProduct.description,
    longDescription: djangoProduct.description || djangoProduct.short_description,
    category: categoryName,
    price: parseFloat(djangoProduct.price || djangoProduct.current_price || '0'),
    salePrice: djangoProduct.sale_price ? parseFloat(djangoProduct.sale_price) : null,
    costPrice: djangoProduct.cost_price ? parseFloat(djangoProduct.cost_price) : null,
    currentPrice: parseFloat(djangoProduct.current_price || djangoProduct.price || '0'),
    stockQuantity: djangoProduct.stock_quantity || 0,
    lowStockThreshold: djangoProduct.low_stock_threshold || 5,
    isActive: djangoProduct.is_active ?? true,
    isFeatured: djangoProduct.is_featured ?? false,
    isDigital: djangoProduct.is_digital ?? false,
    sku: djangoProduct.sku || '',
    imageUrl: djangoProduct.primary_image || (djangoProduct.images && djangoProduct.images[0]?.image) || null,
    images: djangoProduct.images_urls || (djangoProduct.images ? djangoProduct.images.map((img: any) => img.image) : []),
    averageRating: parseFloat(djangoProduct.average_rating || '0'),
    totalReviews: djangoProduct.total_reviews || 0,
    isInStock: djangoProduct.is_in_stock ?? true,
    isLowStock: djangoProduct.is_low_stock ?? false,
    isOnSale: djangoProduct.is_on_sale ?? false,
    discountPercentage: djangoProduct.discount_percentage || 0,
    createdAt: djangoProduct.created_at,
    updatedAt: djangoProduct.updated_at,
    slug: djangoProduct.slug
  }
}

/**
 * Upload multiple product images to Django backend
 */
export async function uploadMultipleProductImages(
  files: File[],
  productId?: string
): Promise<{ success: boolean, urls?: string[], errors?: string[] }> {
  console.log('[Django Upload] Starting upload of', files.length, 'files for product', productId)
  
  if (!files || files.length === 0) {
    console.log('[Django Upload] No files provided')
    return { success: false, errors: ['No files provided'] }
  }
  
  try {
    const formData = new FormData()
    
    // Add images to form data
    files.forEach((file, index) => {
      console.log(`[Django Upload] Adding file ${index + 1}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      formData.append('images', file)
    })
    
    // Add optional parameters
    if (productId) {
      formData.append('product_id', productId)
      console.log('[Django Upload] Product ID:', productId)
    }
    formData.append('set_primary', 'true')
    
    const url = `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1'}/upload/products/`
    console.log('[Django Upload] Sending to URL:', url)
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''
    console.log('[Django Upload] Token available:', !!token)
    console.log('[Django Upload] Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData - browser handles it automatically with boundary
      },
      body: formData
    })
    
    console.log('[Django Upload] Response status:', response.status)
    console.log('[Django Upload] Response ok:', response.ok)
    
    const data = await response.json()
    console.log('[Django Upload] Response data:', data)
    
    if (!response.ok) {
      console.error('[Django Upload] Request failed:', data)
      return {
        success: false,
        errors: data.errors || [data.message || 'Erro no upload']
      }
    }
    
    if (data.success) {
      const urls = data.uploaded_files?.map((file: any) => file.file_url) || []
      console.log('[Django Upload] Upload successful, URLs:', urls)
      return {
        success: true,
        urls: urls.length > 0 ? urls : undefined,
        errors: data.errors && data.errors.length > 0 ? data.errors : undefined
      }
    } else {
      console.error('[Django Upload] Upload marked as failed:', data)
      return {
        success: false,
        errors: data.errors || ['Erro desconhecido no upload']
      }
    }
  } catch (error) {
    console.error('[Django Upload] Exception during upload:', error)
    return {
      success: false,
      errors: ['Erro de conexão ao fazer upload das imagens']
    }
  }
}

// ============================================================================
// PRODUCT IMAGE MANAGEMENT
// ============================================================================

export interface ProductImage {
  id: string
  image: string
  alt_text: string
  image_type: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

/**
 * Get all images for a specific product
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const response = await apiCall<any>(`/products/${productId}/images/`)
    
    // Handle paginated response or direct array
    if (response && Array.isArray(response.results)) {
      return response.results
    } else if (Array.isArray(response)) {
      return response
    }
    
    console.log('[getProductImages] Unexpected response format:', response)
    return []
  } catch (error) {
    console.error('Error fetching product images:', error)
    return []
  }
}

/**
 * Delete a specific product image
 */
export async function deleteProductImage(imageId: string): Promise<{ success: boolean; message?: string }> {
  try {
    await apiCall(`/products/images/${imageId}/`, {
      method: 'DELETE'
    })
    
    return {
      success: true,
      message: 'Imagem deletada com sucesso'
    }
  } catch (error) {
    console.error('Error deleting product image:', error)
    return {
      success: false,
      message: 'Erro ao deletar imagem'
    }
  }
}

/**
 * Update product image metadata
 */
export async function updateProductImage(
  imageId: string, 
  updates: Partial<Pick<ProductImage, 'alt_text' | 'is_primary' | 'sort_order'>>
): Promise<{ success: boolean; image?: ProductImage; message?: string }> {
  try {
    const response = await apiCall<ProductImage>(`/products/images/${imageId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    
    return {
      success: true,
      image: response,
      message: 'Imagem atualizada com sucesso'
    }
  } catch (error) {
    console.error('Error updating product image:', error)
    return {
      success: false,
      message: 'Erro ao atualizar imagem'
    }
  }
}
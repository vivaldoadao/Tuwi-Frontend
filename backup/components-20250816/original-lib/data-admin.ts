/**
 * Administrative functions using Supabase Service Role
 * These functions bypass RLS for admin operations
 */

import { createAdminClient } from './supabase/admin'
import type { ProductAdmin } from './data-supabase'

// Initialize admin client only when needed to avoid issues with env vars
function getAdminClient() {
  return createAdminClient()
}

// ============================================================================
// ADMIN PRODUCT FUNCTIONS
// ============================================================================

export async function createProductAdmin(productData: {
  name: string
  description: string
  longDescription?: string
  price: number
  category: string
  stockQuantity: number
  images?: string[]
}): Promise<{ success: boolean, error?: string, productId?: string }> {
  try {
    const productInsertData = {
      name: productData.name,
      description: productData.description,
      long_description: productData.longDescription || productData.description,
      price: productData.price.toString(),
      category: productData.category,
      stock_quantity: productData.stockQuantity,
      images: productData.images || [],
      is_active: true
    }

    const adminSupabase = getAdminClient()
    const { data, error } = await adminSupabase
      .from('products')
      .insert([productInsertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating product (admin):', error)
      return { success: false, error: error.message }
    }

    return { success: true, productId: data.id }
  } catch (error) {
    console.error('Unexpected error creating product (admin):', error)
    return { success: false, error: 'Erro inesperado ao criar produto' }
  }
}

export async function updateProductAdmin(
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
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (productData.name !== undefined) updateData.name = productData.name
    if (productData.description !== undefined) updateData.description = productData.description
    if (productData.longDescription !== undefined) updateData.long_description = productData.longDescription
    if (productData.price !== undefined) updateData.price = productData.price.toString()
    if (productData.category !== undefined) updateData.category = productData.category
    if (productData.stockQuantity !== undefined) updateData.stock_quantity = productData.stockQuantity
    if (productData.images !== undefined) updateData.images = productData.images

    const adminSupabase = getAdminClient()
    const { error } = await adminSupabase
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (error) {
      console.error('Error updating product (admin):', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating product (admin):', error)
    return { success: false, error: 'Erro inesperado ao atualizar produto' }
  }
}

export async function toggleProductStatusAdmin(
  productId: string
): Promise<{ success: boolean, error?: string, isActive?: boolean }> {
  try {
    const adminSupabase = getAdminClient()
    // First get current status
    const { data: productData, error: fetchError } = await adminSupabase
      .from('products')
      .select('is_active')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('Error fetching product status (admin):', fetchError)
      return { success: false, error: fetchError.message }
    }

    const newStatus = !productData.is_active

    const { error: updateError } = await adminSupabase
      .from('products')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Error updating product status (admin):', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, isActive: newStatus }
  } catch (error) {
    console.error('Unexpected error toggling product status (admin):', error)
    return { success: false, error: 'Erro inesperado ao alterar status do produto' }
  }
}

export async function deleteProductAdmin(
  productId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    const adminSupabase = getAdminClient()
    const { error } = await adminSupabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product (admin):', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting product (admin):', error)
    return { success: false, error: 'Erro inesperado ao excluir produto' }
  }
}

export async function getAllProductsAdminSecure(
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string
): Promise<{ products: ProductAdmin[], total: number, hasMore: boolean }> {
  try {
    const adminSupabase = getAdminClient()
    let query = adminSupabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Add category filter if provided
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products admin (secure):', error)
      return { products: [], total: 0, hasMore: false }
    }

    const products: ProductAdmin[] = (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images[0] || '/placeholder.svg',
      description: product.description || '',
      longDescription: product.long_description || '',
      category: product.category || 'Outros',
      stockQuantity: product.stock_quantity || 0,
      isActive: product.is_active ?? true,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      images: product.images || []
    }))

    const total = count || 0
    const hasMore = (page * limit) < total

    return { products, total, hasMore }
  } catch (error) {
    console.error('Unexpected error fetching products admin (secure):', error)
    return { products: [], total: 0, hasMore: false }
  }
}
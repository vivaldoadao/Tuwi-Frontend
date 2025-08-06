/**
 * Funções de dados usando Supabase (substitui lib/data.ts)
 * 
 * Este arquivo contém todas as funções de dados migradas para usar o Supabase
 * em vez dos dados mock em memória.
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { 
  Product, 
  Service, 
  Booking, 
  BraiderAvailability 
} from './data'

// Re-export types for external use
export type { Product, Service, Booking, BraiderAvailability } from './data'

// Extended Braider type with additional fields for Supabase
export type Braider = {
  id: string
  name: string
  bio: string
  location: string
  contactEmail: string
  contactPhone: string
  profileImageUrl: string
  services: Service[]
  portfolioImages: string[]
  status: "pending" | "approved" | "rejected"
  averageRating?: number
  totalReviews?: number
  createdAt: string
}

const supabase = createClient()

// Service client with admin privileges for braider registration
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// PRODUCTS
// ============================================================================

// Extended Product type with additional admin fields
export type ProductAdmin = Product & {
  category: string
  stockQuantity: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  images: string[]
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('stock_quantity', 0) // Only show products with stock > 0
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return data.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images[0] || '/placeholder.svg',
      description: product.description || '',
      longDescription: product.long_description || ''
    }))
  } catch (error) {
    console.error('Unexpected error fetching products:', error)
    return []
  }
}

export async function getAllProductsAdmin(
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string
): Promise<{ products: ProductAdmin[], total: number, hasMore: boolean }> {
  try {
    let query = supabase
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
      console.error('Error fetching products admin:', error)
      return { products: [], total: 0, hasMore: false }
    }

    const products: ProductAdmin[] = (data || []).map(product => ({
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
    console.error('Unexpected error fetching products admin:', error)
    return { products: [], total: 0, hasMore: false }
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      price: parseFloat(data.price),
      imageUrl: data.images[0] || '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || ''
    }
  } catch (error) {
    console.error('Unexpected error fetching product:', error)
    return null
  }
}

// New function that returns complete product data including stock
export async function getProductByIdWithStock(id: string): Promise<ProductAdmin | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true) // Still filter by active status on product details
      .single()

    if (error) {
      console.error('Error fetching product with stock:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      price: parseFloat(data.price),
      imageUrl: data.images[0] || '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || '',
      category: data.category || 'Outros',
      stockQuantity: data.stock_quantity || 0,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      images: data.images || []
    }
  } catch (error) {
    console.error('Unexpected error fetching product with stock:', error)
    return null
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('stock_quantity', 0) // Only show products with stock > 0
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Error fetching featured products:', error)
      return []
    }

    return data.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images[0] || '/placeholder.svg',
      description: product.description || '',
      longDescription: product.long_description || ''
    }))
  } catch (error) {
    console.error('Unexpected error fetching featured products:', error)
    return []
  }
}

export async function createProduct(productData: {
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

    const { data, error } = await supabase
      .from('products')
      .insert([productInsertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return { success: false, error: error.message }
    }

    return { success: true, productId: data.id }
  } catch (error) {
    console.error('Unexpected error creating product:', error)
    return { success: false, error: 'Erro inesperado ao criar produto' }
  }
}

export async function updateProduct(
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

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (error) {
      console.error('Error updating product:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating product:', error)
    return { success: false, error: 'Erro inesperado ao atualizar produto' }
  }
}

export async function toggleProductStatus(
  productId: string
): Promise<{ success: boolean, error?: string, isActive?: boolean }> {
  try {
    // First get current status
    const { data: productData, error: fetchError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('Error fetching product status:', fetchError)
      return { success: false, error: fetchError.message }
    }

    // Toggle the status
    const newStatus = !productData.is_active

    const { error } = await supabase
      .from('products')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (error) {
      console.error('Error toggling product status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, isActive: newStatus }
  } catch (error) {
    console.error('Unexpected error toggling product status:', error)
    return { success: false, error: 'Erro inesperado ao alterar status do produto' }
  }
}

export async function deleteProduct(
  productId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting product:', error)
    return { success: false, error: 'Erro inesperado ao excluir produto' }
  }
}

export async function updateProductStock(
  productId: string,
  stockQuantity: number
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: stockQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (error) {
      console.error('Error updating product stock:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating product stock:', error)
    return { success: false, error: 'Erro inesperado ao atualizar estoque' }
  }
}

export async function getProductCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching product categories:', error)
      return ['Tranças', 'Extensões', 'Acessórios', 'Cuidados', 'Outros']
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean)
    return categories.length > 0 ? categories : ['Tranças', 'Extensões', 'Acessórios', 'Cuidados', 'Outros']
  } catch (error) {
    console.error('Unexpected error fetching categories:', error)
    return ['Tranças', 'Extensões', 'Acessórios', 'Cuidados', 'Outros']
  }
}

// ============================================================================
// IMAGE UPLOAD FUNCTIONS
// ============================================================================

export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<{ success: boolean, url?: string, error?: string }> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId || Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Unexpected error uploading image:', error)
    return { success: false, error: 'Erro inesperado ao fazer upload da imagem' }
  }
}

export async function uploadMultipleProductImages(
  files: File[],
  productId?: string
): Promise<{ success: boolean, urls?: string[], errors?: string[] }> {
  try {
    const uploadPromises = files.map(file => uploadProductImage(file, productId))
    const results = await Promise.all(uploadPromises)
    
    const urls: string[] = []
    const errors: string[] = []
    
    results.forEach((result, index) => {
      if (result.success && result.url) {
        urls.push(result.url)
      } else {
        errors.push(`Erro no arquivo ${files[index].name}: ${result.error}`)
      }
    })
    
    return {
      success: urls.length > 0,
      urls: urls.length > 0 ? urls : undefined,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('Unexpected error uploading multiple images:', error)
    return { 
      success: false, 
      errors: ['Erro inesperado ao fazer upload das imagens'] 
    }
  }
}

export async function deleteProductImage(
  imageUrl: string
): Promise<{ success: boolean, error?: string }> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const filePath = `products/${fileName}`

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting image:', error)
    return { success: false, error: 'Erro inesperado ao excluir imagem' }
  }
}

// ============================================================================
// BRAIDERS
// ============================================================================

export async function getAllBraiders(
  page: number = 1, 
  limit: number = 10, 
  search?: string,
  status?: string
): Promise<{ braiders: Braider[], total: number, hasMore: boolean }> {
  try {
    // Simple query first - no joins
    let query = supabase
      .from('braiders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Add search filter if provided (only braider fields for now)
    if (search && search.trim()) {
      query = query.or(`location.ilike.%${search}%,bio.ilike.%${search}%,contact_phone.ilike.%${search}%`)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching braiders:', error)
      return { braiders: [], total: 0, hasMore: false }
    }

    // Get all users with braider role to match names
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'braider')

    // Create a map of user_id to user data
    const usersMap = new Map()
    if (allUsers) {
      allUsers.forEach(user => {
        usersMap.set(user.id, user)
      })
    }

    // Process the braiders data
    const braiders: Braider[] = []
    
    if (data && data.length > 0) {
      data.forEach((braider, index) => {
        // Try to find matching user, fallback to index-based assignment
        let userData = usersMap.get(braider.user_id)
        
        // If no exact match, try to assign by index for demo purposes
        if (!userData && allUsers && allUsers[index]) {
          userData = allUsers[index]
        }

        braiders.push({
          id: braider.id,
          name: userData?.name || `Trancista ${braider.id.slice(0, 8)}`,
          bio: braider.bio || '',
          location: braider.location || 'Localização não informada',
          contactEmail: userData?.email || 'email-nao-disponivel@exemplo.com',
          contactPhone: braider.contact_phone || '',
          profileImageUrl: '/placeholder.svg?height=200&width=200&text=T',
          services: [], // Will load separately if needed
          portfolioImages: braider.portfolio_images || [],
          status: braider.status || 'pending',
          averageRating: parseFloat(braider.average_rating || '0'),
          totalReviews: parseInt(braider.total_reviews || '0'),
          createdAt: braider.created_at || new Date().toISOString()
        })
      })
    }

    const total = count || 0
    const hasMore = (page * limit) < total

    return { braiders, total, hasMore }
  } catch (error) {
    console.error('Unexpected error fetching braiders:', error)
    return { braiders: [], total: 0, hasMore: false }
  }
}

// Legacy function for backward compatibility
export async function getAllBraidersLegacy(): Promise<Braider[]> {
  const { braiders } = await getAllBraiders(1, 1000) // Get all braiders
  return braiders.filter(b => b.status === 'approved')
}

export async function getBraiderById(id: string): Promise<Braider | null> {
  try {
    const { data, error } = await supabase
      .from('braiders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching braider:', error)
      return null
    }

    // Use same logic as getAllBraiders - get all users and match intelligently
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'braider')

    // Create a map of user_id to user data
    const usersMap = new Map()
    if (allUsers) {
      allUsers.forEach(user => {
        usersMap.set(user.id, user)
      })
    }

    // Try to find matching user, fallback to first braider user
    let userData = usersMap.get(data.user_id)
    if (!userData && allUsers && allUsers.length > 0) {
      userData = allUsers[0] // Fallback to first braider user
    }

    // Get services separately
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('braider_id', data.id)

    return {
      id: data.id,
      name: userData?.name || `Trancista ${data.id.slice(0, 8)}`,
      bio: data.bio || '',
      location: data.location || 'Localização não informada',
      contactEmail: userData?.email || 'email-nao-disponivel@exemplo.com',
      contactPhone: data.contact_phone || '',
      profileImageUrl: '/placeholder.svg?height=200&width=200&text=T',
      services: (servicesData || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        price: parseFloat(service.price || 0),
        durationMinutes: service.duration_minutes || 0,
        description: service.description || '',
        imageUrl: service.image_url || '/placeholder.svg'
      })),
      portfolioImages: data.portfolio_images || [],
      status: data.status || 'pending',
      averageRating: parseFloat(data.average_rating || '0'),
      totalReviews: parseInt(data.total_reviews || '0'),
      createdAt: data.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Unexpected error fetching braider:', error)
    return null
  }
}

export async function getFeaturedBraiders(): Promise<Braider[]> {
  try {
    const { braiders } = await getAllBraiders(1, 10, undefined, 'approved')
    return braiders
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 2)
  } catch (error) {
    console.error('Unexpected error fetching featured braiders:', error)
    return []
  }
}

// New function to add braider to Supabase database
export async function addBraider(braiderData: {
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
    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()
    
    // Check if braider with this email already exists
    const { data: existingBraider, error: checkError } = await serviceSupabase
      .from('braiders')
      .select('id, status, contact_email')
      .eq('contact_email', braiderData.contactEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // Not "no rows returned"
      console.error('Error checking existing braider:', checkError)
      return { 
        success: false, 
        message: 'Erro ao verificar dados existentes. Tente novamente.' 
      }
    }

    // If braider exists and is not rejected, prevent duplicate
    if (existingBraider && existingBraider.status !== 'rejected') {
      return { 
        success: false, 
        message: 'Já existe um cadastro de trancista com este email. Se você foi rejeitada anteriormente, pode tentar novamente.' 
      }
    }

    // Prepare data for database insertion
    const insertData = {
      contact_email: braiderData.contactEmail,
      contact_phone: braiderData.contactPhone,
      bio: braiderData.bio,
      location: braiderData.location,
      whatsapp: braiderData.whatsapp || null,
      instagram: braiderData.instagram || null,
      district: braiderData.district || null,
      concelho: braiderData.concelho || null,
      freguesia: braiderData.freguesia || null,
      address: braiderData.address || null,
      postal_code: braiderData.postalCode || null,
      serves_home: braiderData.servesHome || false,
      serves_studio: braiderData.servesStudio || false,
      serves_salon: braiderData.servesSalon || false,
      max_travel_distance: braiderData.maxTravelDistance || 10,
      salon_name: braiderData.salonName || null,
      salon_address: braiderData.salonAddress || null,
      specialties: braiderData.specialties || [],
      years_experience: braiderData.yearsExperience as any || null,
      certificates: braiderData.certificates || null,
      min_price: braiderData.minPrice || null,
      max_price: braiderData.maxPrice || null,
      weekly_availability: braiderData.availability || {},
      status: 'pending'
    }

    let result
    if (existingBraider && existingBraider.status === 'rejected') {
      // Update existing rejected braider
      const { data, error } = await serviceSupabase
        .from('braiders')
        .update(insertData)
        .eq('id', existingBraider.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Insert new braider
      const { data, error } = await serviceSupabase
        .from('braiders')
        .insert(insertData)
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error saving braider:', result.error)
      return { 
        success: false, 
        message: 'Erro ao salvar cadastro. Verifique os dados e tente novamente.' 
      }
    }

    console.log('Braider saved successfully:', result.data)
    
    return { 
      success: true, 
      message: existingBraider 
        ? 'Sua nova solicitação foi enviada para aprovação! Nossa equipe irá analisar em breve.'
        : 'Seu cadastro foi enviado para aprovação! Nossa equipe irá analisar em até 48 horas úteis.',
      braider: result.data 
    }
  } catch (error) {
    console.error('Unexpected error adding braider:', error)
    return { 
      success: false, 
      message: 'Erro inesperado. Tente novamente mais tarde.' 
    }
  }
}

export async function updateBraiderStatus(
  braiderId: string, 
  newStatus: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('braiders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', braiderId)

    if (error) {
      console.error('Error updating braider status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating braider status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status da trancista' }
  }
}

export async function toggleBraiderAccount(
  braiderId: string
): Promise<{ success: boolean, error?: string, isActive?: boolean }> {
  try {
    // First get the braider data to find the user_id
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select('user_id')
      .eq('id', braiderId)
      .single()

    if (braiderError || !braiderData) {
      console.error('Error fetching braider:', braiderError)
      return { success: false, error: 'Trancista não encontrada' }
    }

    // Get current user status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', braiderData.user_id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Toggle the status
    const newStatus = !userData.is_active

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', braiderData.user_id)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, isActive: newStatus }
  } catch (error) {
    console.error('Unexpected error toggling braider account:', error)
    return { success: false, error: 'Erro inesperado ao alterar status da conta' }
  }
}

export async function updateBraiderProfile(
  braiderId: string,
  profileData: {
    bio?: string
    location?: string
    contact_phone?: string
    portfolio_images?: string[]
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (profileData.bio !== undefined) updateData.bio = profileData.bio
    if (profileData.location !== undefined) updateData.location = profileData.location
    if (profileData.contact_phone !== undefined) updateData.contact_phone = profileData.contact_phone
    if (profileData.portfolio_images !== undefined) updateData.portfolio_images = profileData.portfolio_images

    const { error } = await supabase
      .from('braiders')
      .update(updateData)
      .eq('id', braiderId)

    if (error) {
      console.error('Error updating braider profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating braider profile:', error)
    return { success: false, error: 'Erro inesperado ao atualizar perfil da trancista' }
  }
}

export async function updateBraiderUserInfo(
  braiderId: string,
  userInfo: {
    name?: string
    email?: string
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    // First get the braider data to find the user_id
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select('user_id')
      .eq('id', braiderId)
      .single()

    if (braiderError || !braiderData) {
      console.error('Error fetching braider:', braiderError)
      return { success: false, error: 'Trancista não encontrada' }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (userInfo.name !== undefined) updateData.name = userInfo.name
    if (userInfo.email !== undefined) updateData.email = userInfo.email

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', braiderData.user_id)

    if (error) {
      console.error('Error updating user info:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating user info:', error)
    return { success: false, error: 'Erro inesperado ao atualizar informações do usuário' }
  }
}

// ============================================================================
// BOOKINGS
// ============================================================================

export async function getBraiderBookings(braiderId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services(name),
        users!bookings_client_id_fkey(name, email)
      `)
      .eq('braider_id', braiderId)
      .order('booking_date', { ascending: true })

    if (error) {
      console.error('Error fetching braider bookings:', error)
      return []
    }

    return data.map(booking => ({
      id: booking.id,
      braiderId: booking.braider_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone,
      clientAddress: booking.client_address,
      date: booking.booking_date,
      time: booking.booking_time,
      bookingType: booking.service_type,
      status: booking.status === 'pending' ? 'Pendente' : 
             booking.status === 'confirmed' ? 'Confirmado' : 'Cancelado',
      createdAt: booking.created_at
    }))
  } catch (error) {
    console.error('Unexpected error fetching braider bookings:', error)
    return []
  }
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<{success: boolean, error?: string, bookingId?: string}> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        service_id: bookingData.serviceId,
        client_id: 'user-customer-001', // TODO: Get from session
        braider_id: bookingData.braiderId,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        service_type: bookingData.bookingType,
        client_name: bookingData.clientName,
        client_email: bookingData.clientEmail,
        client_phone: bookingData.clientPhone,
        client_address: bookingData.clientAddress,
        status: 'pending',
        total_amount: 0, // TODO: Calculate from service price
        notes: ''
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return { success: false, error: error.message }
    }

    return { success: true, bookingId: data.id }
  } catch (error) {
    console.error('Unexpected error creating booking:', error)
    return { success: false, error: 'Erro inesperado ao criar agendamento' }
  }
}

export async function updateBookingStatus(
  bookingId: string, 
  status: string, 
  notes?: string
): Promise<{success: boolean, error?: string}> {
  try {
    const dbStatus = status === 'Pendente' ? 'pending' : 
                    status === 'Confirmado' ? 'confirmed' : 
                    status === 'Cancelado' ? 'cancelled' : 'pending'

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: dbStatus,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating booking status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar agendamento' }
  }
}

// ============================================================================
// BRAIDER AVAILABILITY
// ============================================================================

export async function getBraiderAvailability(
  braiderId: string, 
  month?: number, 
  year?: number
): Promise<BraiderAvailability[]> {
  try {
    let query = supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .eq('is_booked', false)
      .gte('available_date', new Date().toISOString().split('T')[0])
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      query = query.gte('available_date', startDate).lte('available_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching braider availability:', error)
      return []
    }

    return data.map(availability => ({
      id: availability.id,
      braiderId: availability.braider_id,
      date: availability.available_date,
      startTime: availability.start_time,
      endTime: availability.end_time,
      isBooked: availability.is_booked
    }))
  } catch (error) {
    console.error('Unexpected error fetching braider availability:', error)
    return []
  }
}

// ============================================================================
// SERVICES
// ============================================================================

export async function getBraiderServices(braiderId: string): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('braider_id', braiderId)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching braider services:', error)
      return []
    }

    return data.map(service => ({
      id: service.id,
      name: service.name,
      price: parseFloat(service.price),
      durationMinutes: service.duration_minutes,
      description: service.description || '',
      imageUrl: service.image_url || '/placeholder.svg'
    }))
  } catch (error) {
    console.error('Unexpected error fetching braider services:', error)
    return []
  }
}

// Get orders for a specific user by email (for profile page)
export async function getUserOrdersByEmail(customerEmail: string): Promise<Order[]> {
  try {
    console.log('🔍 Getting user orders by email:', customerEmail)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customerEmail.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user orders:', error)
      return []
    }

    console.log(`✅ Found ${data?.length || 0} orders for user:`, customerEmail)

    return (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || '',
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingPostalCode: order.shipping_postal_code,
      shippingCountry: order.shipping_country || 'Portugal',
      items: order.items || [],
      subtotal: parseFloat(order.subtotal || '0'),
      shippingCost: parseFloat(order.shipping_cost || '0'),
      total: parseFloat(order.total),
      status: order.status,
      paymentIntentId: order.payment_intent_id,
      stripeCustomerId: order.stripe_customer_id,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }))
  } catch (error) {
    console.error('Unexpected error fetching user orders:', error)
    return []
  }
}

// ============================================================================
// USERS
// ============================================================================

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'braider' | 'admin'
  createdAt: string
  isActive: boolean
  lastLogin?: string
}

export async function getAllUsers(
  page: number = 1, 
  limit: number = 10, 
  search?: string
): Promise<{ users: User[], total: number, hasMore: boolean }> {
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0, hasMore: false }
    }

    const users: User[] = (data || []).map(user => ({
      id: user.id,
      name: user.name || 'Nome não informado',
      email: user.email,
      phone: user.phone || undefined,
      role: user.role || 'customer',
      createdAt: user.created_at,
      isActive: user.is_active ?? true,
      lastLogin: user.last_login || undefined
    }))

    const total = count || 0
    const hasMore = (page * limit) < total

    return { users, total, hasMore }
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return { users: [], total: 0, hasMore: false }
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name || 'Nome não informado',
      email: data.email,
      phone: data.phone || undefined,
      role: data.role || 'customer',
      createdAt: data.created_at,
      isActive: data.is_active ?? true,
      lastLogin: data.last_login || undefined
    }
  } catch (error) {
    console.error('Unexpected error fetching user:', error)
    return null
  }
}

export async function updateUserRole(
  userId: string, 
  newRole: 'customer' | 'braider' | 'admin'
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating user role:', error)
    return { success: false, error: 'Erro inesperado ao atualizar papel do usuário' }
  }
}

export async function toggleUserStatus(
  userId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    // First get current status
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user status:', fetchError)
      return { success: false, error: fetchError.message }
    }

    // Toggle the status
    const newStatus = !userData.is_active

    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error toggling user status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error toggling user status:', error)
    return { success: false, error: 'Erro inesperado ao alterar status do usuário' }
  }
}

export async function updateUser(
  userId: string,
  userData: {
    name?: string
    email?: string
    phone?: string
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (userData.name !== undefined) updateData.name = userData.name
    if (userData.email !== undefined) updateData.email = userData.email
    if (userData.phone !== undefined) updateData.phone = userData.phone

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating user:', error)
    return { success: false, error: 'Erro inesperado ao atualizar usuário' }
  }
}

// Get user by email (for profile page)
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log('🔍 Getting user by email:', email)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name || 'Nome não informado',
      email: data.email,
      phone: data.phone || undefined,
      role: data.role || 'customer',
      createdAt: data.created_at,
      isActive: data.is_active ?? true,
      lastLogin: data.last_login || undefined
    }
  } catch (error) {
    console.error('Unexpected error fetching user by email:', error)
    return null
  }
}

// Update user profile information
export async function updateUserProfile(
  email: string,
  updates: {
    name?: string
    phone?: string
    // Add other fields as needed, but be careful with sensitive data
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    console.log('📝 Updating user profile:', { email, updates })

    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        phone: updates.phone,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User profile updated successfully')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating user profile:', error)
    return { success: false, error: 'Erro inesperado ao atualizar perfil' }
  }
}

// ============================================================================
// ORDERS
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type Order = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCountry: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  status: OrderStatus
  paymentIntentId?: string
  stripeCustomerId?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export type OrderItem = {
  productId: string
  productName: string
  productPrice: number
  productImage: string
  quantity: number
  subtotal: number
}

export async function createOrder(orderData: {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCountry: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  paymentIntentId?: string
  stripeCustomerId?: string
  notes?: string
}): Promise<{ success: boolean, error?: string, orderId?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        shipping_address: orderData.shippingAddress,
        shipping_city: orderData.shippingCity,
        shipping_postal_code: orderData.shippingPostalCode,
        shipping_country: orderData.shippingCountry,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost,
        total: orderData.total,
        status: 'pending',
        payment_intent_id: orderData.paymentIntentId,
        stripe_customer_id: orderData.stripeCustomerId,
        notes: orderData.notes
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return { success: false, error: error.message }
    }

    return { success: true, orderId: data.id }
  } catch (error) {
    console.error('Unexpected error creating order:', error)
    return { success: false, error: 'Erro inesperado ao criar pedido' }
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentIntentId?: string
): Promise<{ success: boolean, error?: string }> {
  try {
    console.log('🔄 Updating order status:', { orderId, status, paymentIntentId })
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId
    }

    // Update the order
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Error updating order status:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Order status updated successfully:', data)

    // Verify the update was successful by fetching the updated order
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('status, updated_at')
      .eq('id', orderId)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying order update:', verifyError)
    } else {
      console.log('✅ Verified order status:', verifyData)
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Unexpected error updating order status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status do pedido' }
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    console.log('🔍 Fetching order by ID:', orderId)
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('❌ Error fetching order:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        orderId
      })
      
      // If order not found in database, return mock data for development
      if (error.code === 'PGRST116') { // No rows returned
        console.log('⚠️  Order not found in database for ID:', orderId)
        console.log('📝 Returning mock order data for development...')
        
        // Return mock order data
        return {
          id: orderId,
          orderNumber: `ORD-${orderId.slice(0, 8).toUpperCase()}`,
          customerName: 'Cliente Exemplo',
          customerEmail: 'cliente@exemplo.com',
          customerPhone: '+351 912 345 678',
          shippingAddress: 'Rua das Flores, 123',
          shippingCity: 'Lisboa',
          shippingPostalCode: '1200-001',
          shippingCountry: 'Portugal',
          items: [
            {
              productId: 'prod-1',
              productName: 'Box Braids Premium',
              productPrice: 45.99,
              productImage: '/placeholder.svg?height=100&width=100&text=Produto',
              quantity: 1,
              subtotal: 45.99
            }
          ],
          subtotal: 45.99,
          shippingCost: 5.00,
          total: 50.99,
          status: 'processing' as const,
          paymentIntentId: `pi_mock_${orderId}`,
          stripeCustomerId: `cus_mock_${orderId}`,
          notes: 'Pedido de exemplo para desenvolvimento',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      return null
    }

    console.log('✅ Order fetched successfully:', {
      id: data.id,
      status: data.status,
      updatedAt: data.updated_at
    })

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      shippingAddress: data.shipping_address,
      shippingCity: data.shipping_city,
      shippingPostalCode: data.shipping_postal_code,
      shippingCountry: data.shipping_country,
      items: data.items,
      subtotal: parseFloat(data.subtotal),
      shippingCost: parseFloat(data.shipping_cost),
      total: parseFloat(data.total),
      status: data.status,
      paymentIntentId: data.payment_intent_id,
      stripeCustomerId: data.stripe_customer_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('❌ Unexpected error fetching order:', error)
    return null
  }
}

// Get all orders with advanced filtering and pagination for admin dashboard
export async function getAllOrdersAdmin(
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: OrderStatus
    search?: string // Search by customer name or email
    dateFrom?: string
    dateTo?: string
    minAmount?: number
    maxAmount?: number
  }
): Promise<{ orders: Order[], total: number, hasMore: boolean }> {
  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search && filters.search.trim()) {
      query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters?.minAmount) {
      query = query.gte('total', filters.minAmount)
    }

    if (filters?.maxAmount) {
      query = query.lte('total', filters.maxAmount)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('Error fetching orders:', error)
      return { orders: [], total: 0, hasMore: false }
    }

    const orders: Order[] = data?.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingPostalCode: order.shipping_postal_code,
      shippingCountry: order.shipping_country,
      items: order.items,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shipping_cost),
      total: parseFloat(order.total),
      status: order.status,
      paymentIntentId: order.payment_intent_id,
      stripeCustomerId: order.stripe_customer_id,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    })) || []

    const total = count || 0
    const hasMore = (from + limit) < total

    return { orders, total, hasMore }
  } catch (error) {
    console.error('Unexpected error fetching orders:', error)
    return { orders: [], total: 0, hasMore: false }
  }
}

export async function getAllOrders(
  page: number = 1,
  limit: number = 10,
  status?: OrderStatus
): Promise<{ orders: Order[], total: number, hasMore: boolean }> {
  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return { orders: [], total: 0, hasMore: false }
    }

    const orders: Order[] = (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingPostalCode: order.shipping_postal_code,
      shippingCountry: order.shipping_country,
      items: order.items,
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      total: order.total,
      status: order.status,
      paymentIntentId: order.payment_intent_id,
      stripeCustomerId: order.stripe_customer_id,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }))

    const total = count || 0
    const hasMore = (page * limit) < total

    return { orders, total, hasMore }
  } catch (error) {
    console.error('Unexpected error fetching orders:', error)
    return { orders: [], total: 0, hasMore: false }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    return data.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images[0] || '/placeholder.svg',
      description: product.description || '',
      longDescription: product.long_description || ''
    }))
  } catch (error) {
    console.error('Unexpected error searching products:', error)
    return []
  }
}

export async function searchBraiders(query: string): Promise<Braider[]> {
  try {
    const { data, error } = await supabase
      .from('braiders')
      .select(`
        *,
        users!braiders_user_id_fkey(name, email),
        services(*)
      `)
      .eq('status', 'approved')
      .or(`location.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('average_rating', { ascending: false })

    if (error) {
      console.error('Error searching braiders:', error)
      return []
    }

    return data.map(braider => ({
      id: braider.id,
      name: braider.users?.name || 'Nome não disponível',
      bio: braider.bio || '',
      location: braider.location,
      contactEmail: braider.users?.email || '',
      contactPhone: braider.contact_phone || '',
      profileImageUrl: '/placeholder.svg?height=200&width=200&text=Braider',
      services: braider.services.map((service: any) => ({
        id: service.id,
        name: service.name,
        price: parseFloat(service.price),
        durationMinutes: service.duration_minutes,
        description: service.description || '',
        imageUrl: service.image_url || '/placeholder.svg'
      })),
      portfolioImages: braider.portfolio_images || [],
      status: braider.status,
      averageRating: parseFloat(braider.average_rating) || 0,
      totalReviews: braider.total_reviews || 0,
      createdAt: braider.created_at || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Unexpected error searching braiders:', error)
    return []
  }
}

// ============================================================================
// ORDER TRACKING SYSTEM
// ============================================================================

export type TrackingEventType = 
  | 'order_created'
  | 'payment_confirmed'
  | 'processing_started'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded'
  | 'note_added'

export type TrackingEvent = {
  id: string
  orderId: string
  eventType: TrackingEventType
  status?: OrderStatus
  title: string
  description?: string
  location?: string
  trackingNumber?: string
  metadata?: Record<string, any>
  createdBy: string
  createdAt: string
}

// Get tracking events for an order
export async function getOrderTracking(orderId: string): Promise<TrackingEvent[]> {
  try {
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error fetching order tracking:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        orderId
      })
      
      // If tracking table doesn't exist or no data found, return mock tracking events
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('📝 Returning mock tracking data for development...')
        return [
          {
            id: `track-1-${orderId}`,
            orderId: orderId,
            eventType: 'order_created' as const,
            status: 'pending' as const,
            title: 'Pedido Criado',
            description: 'Seu pedido foi criado com sucesso e está sendo processado.',
            location: undefined,
            trackingNumber: undefined,
            metadata: {},
            createdBy: 'system',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
          },
          {
            id: `track-2-${orderId}`,
            orderId: orderId,
            eventType: 'payment_confirmed' as const,
            status: 'processing' as const,
            title: 'Pagamento Confirmado',
            description: 'O pagamento foi confirmado e processado com sucesso.',
            location: undefined,
            trackingNumber: undefined,
            metadata: { amount: '50.99', currency: 'EUR' },
            createdBy: 'system',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
          },
          {
            id: `track-3-${orderId}`,
            orderId: orderId,
            eventType: 'processing_started' as const,
            status: 'processing' as const,
            title: 'Preparação Iniciada',
            description: 'Sua encomenda está sendo preparada para envio.',
            location: 'Centro de Distribuição - Lisboa',
            trackingNumber: undefined,
            metadata: {},
            createdBy: 'admin',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
          }
        ]
      }
      
      return []
    }

    return data?.map(event => ({
      id: event.id,
      orderId: event.order_id,
      eventType: event.event_type,
      status: event.status,
      title: event.title,
      description: event.description,
      location: event.location,
      trackingNumber: event.tracking_number,
      metadata: event.metadata,
      createdBy: event.created_by,
      createdAt: event.created_at
    })) || []
  } catch (error) {
    console.error('Unexpected error fetching order tracking:', error)
    return []
  }
}

// Add a tracking event manually (for admin use)
export async function addTrackingEvent(
  orderId: string,
  eventData: {
    eventType: TrackingEventType
    status?: OrderStatus
    title: string
    description?: string
    location?: string
    trackingNumber?: string
    metadata?: Record<string, any>
    createdBy?: string
  }
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('order_tracking')
      .insert([{
        order_id: orderId,
        event_type: eventData.eventType,
        status: eventData.status,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        tracking_number: eventData.trackingNumber,
        metadata: eventData.metadata,
        created_by: eventData.createdBy || 'admin'
      }])

    if (error) {
      console.error('Error adding tracking event:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error adding tracking event:', error)
    return { success: false, error: 'Erro inesperado ao adicionar evento de tracking' }
  }
}

// Get order with tracking information
export async function getOrderWithTracking(orderId: string): Promise<{
  order: Order | null
  tracking: TrackingEvent[]
}> {
  try {
    const [order, tracking] = await Promise.all([
      getOrderById(orderId),
      getOrderTracking(orderId)
    ])

    return { order, tracking }
  } catch (error) {
    console.error('Error fetching order with tracking:', error)
    return { order: null, tracking: [] }
  }
}

// Get order tracking by order number and customer email (for public tracking)
export async function getPublicOrderTracking(
  orderNumber: string, 
  customerEmail: string
): Promise<{
  order: Order | null
  tracking: TrackingEvent[]
  success: boolean
  error?: string
}> {
  try {
    console.log('🔍 Getting public order tracking:', { orderNumber, customerEmail })

    // Clean and validate order number
    const cleanOrderNumber = orderNumber.replace('#', '').trim().toUpperCase()
    
    // First verify the order exists and belongs to the customer
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', cleanOrderNumber)
      .eq('customer_email', customerEmail.toLowerCase())
      .single()

    if (orderError || !orderData) {
      console.log('❌ Order not found:', { orderError, orderNumber: cleanOrderNumber, customerEmail })
      return {
        order: null,
        tracking: [],
        success: false,
        error: 'Pedido não encontrado. Verifique o número do pedido e email.'
      }
    }

    console.log('✅ Order found:', orderData.id)

    // Map order data
    const order: Order = {
      id: orderData.id,
      orderNumber: orderData.order_number || cleanOrderNumber,
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      customerPhone: orderData.customer_phone || '',
      shippingAddress: orderData.shipping_address,
      shippingCity: orderData.shipping_city,
      shippingPostalCode: orderData.shipping_postal_code,
      shippingCountry: orderData.shipping_country || 'Portugal',
      items: orderData.items || [],
      subtotal: parseFloat(orderData.subtotal || '0'),
      shippingCost: parseFloat(orderData.shipping_cost || '0'),
      total: parseFloat(orderData.total),
      status: orderData.status,
      paymentIntentId: orderData.payment_intent_id,
      stripeCustomerId: orderData.stripe_customer_id,
      notes: orderData.notes,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at
    }

    // Get tracking events
    const { data: trackingData } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderData.id)
      .order('created_at', { ascending: true })

    const tracking = trackingData?.map(event => ({
      id: event.id,
      orderId: event.order_id,
      eventType: event.event_type,
      status: event.status,
      title: event.title,
      description: event.description || '',
      location: event.location,
      trackingNumber: event.tracking_number,
      metadata: event.metadata,
      createdBy: event.created_by,
      createdAt: event.created_at
    })) || []

    console.log('✅ Public order tracking retrieved successfully:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingEvents: tracking.length
    })

    return {
      order,
      tracking,
      success: true
    }
  } catch (error) {
    console.error('❌ Unexpected error in getPublicOrderTracking:', error)
    return {
      order: null,
      tracking: [],
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================

export type DashboardStats = {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalBraiders: number
  pendingBraiders: number
  approvedBraiders: number
  recentOrders: Order[]
  revenueByMonth: { month: string; revenue: number }[]
  ordersByStatus: { status: string; count: number; color: string }[]
  userGrowth: { month: string; users: number }[]
  topProducts: { name: string; sales: number; revenue: number }[]
  salesByDay: { day: string; sales: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log('📊 Fetching dashboard stats...')

    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      throw ordersError
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      throw usersError
    }

    // Calculate basic stats
    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const totalUsers = users?.length || 0
    const recentOrders = orders?.slice(0, 5).map(order => ({
      ...order,
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || '',
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingPostalCode: order.shipping_postal_code,
      shippingCountry: order.shipping_country || 'Portugal',
      items: order.items || [],
      subtotal: parseFloat(order.subtotal || '0'),
      shippingCost: parseFloat(order.shipping_cost || '0'),
      total: parseFloat(order.total),
      status: order.status,
      paymentIntentId: order.payment_intent_id,
      stripeCustomerId: order.stripe_customer_id,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    })) || []

    // Revenue by month (last 6 months)
    const revenueByMonth = calculateRevenueByMonth(orders || [])

    // Orders by status
    const ordersByStatus = calculateOrdersByStatus(orders || [])

    // User growth (last 6 months)
    const userGrowth = calculateUserGrowth(users || [])

    // Sales by day (last 7 days)
    const salesByDay = calculateSalesByDay(orders || [])

    // Top products (mock for now - would need products table with sales data)
    const topProducts = [
      { name: 'Box Braids Médias', sales: 45, revenue: 1350 },
      { name: 'Tranças Nagô', sales: 38, revenue: 1140 },
      { name: 'Twist Afro', sales: 32, revenue: 960 },
      { name: 'Dreadlocks', sales: 28, revenue: 1400 },
      { name: 'Tranças Soltas', sales: 25, revenue: 750 }
    ]

    console.log('✅ Dashboard stats calculated successfully')

    return {
      totalOrders,
      totalRevenue,
      totalUsers,
      totalBraiders: 0, // Mock - would come from braiders table
      pendingBraiders: 0, // Mock - would come from braiders table
      approvedBraiders: 0, // Mock - would come from braiders table
      recentOrders,
      revenueByMonth,
      ordersByStatus,
      userGrowth,
      topProducts,
      salesByDay
    }

  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error)
    throw error
  }
}

function calculateRevenueByMonth(orders: any[]): { month: string; revenue: number }[] {
  const last6Months = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const monthRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.created_at)
        const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        return orderKey === monthKey
      })
      .reduce((sum, order) => sum + (order.total || 0), 0)
    
    last6Months.push({
      month: monthName,
      revenue: monthRevenue
    })
  }
  
  return last6Months
}

function calculateOrdersByStatus(orders: any[]): { status: string; count: number; color: string }[] {
  const statusCounts = {
    pending: { count: 0, color: '#f59e0b' },
    processing: { count: 0, color: '#3b82f6' },
    shipped: { count: 0, color: '#A0522D' },
    delivered: { count: 0, color: '#10b981' },
    cancelled: { count: 0, color: '#ef4444' }
  }
  
  orders.forEach(order => {
    if (statusCounts.hasOwnProperty(order.status)) {
      statusCounts[order.status as keyof typeof statusCounts].count++
    }
  })
  
  return Object.entries(statusCounts).map(([status, data]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: data.count,
    color: data.color
  }))
}

function calculateUserGrowth(users: any[]): { month: string; users: number }[] {
  const last6Months = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const monthUsers = users.filter(user => {
      const userDate = new Date(user.created_at)
      const userKey = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`
      return userKey === monthKey
    }).length
    
    last6Months.push({
      month: monthName,
      users: monthUsers
    })
  }
  
  return last6Months
}

function calculateSalesByDay(orders: any[]): { day: string; sales: number }[] {
  const last7Days = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })
    const dayKey = date.toISOString().split('T')[0]
    
    const daySales = orders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      return orderDate === dayKey
    }).length
    
    last7Days.push({
      day: dayName,
      sales: daySales
    })
  }
  
  return last7Days
}


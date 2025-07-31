/**
 * Funções de dados usando Supabase (substitui lib/data.ts)
 * 
 * Este arquivo contém todas as funções de dados migradas para usar o Supabase
 * em vez dos dados mock em memória.
 */

import { createClient } from '@/lib/supabase/client'
import type { 
  Product, 
  Service, 
  Booking, 
  BraiderAvailability 
} from './data'

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

// ============================================================================
// ORDERS
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type Order = {
  id: string
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
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating order status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status do pedido' }
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return null
    }

    return {
      id: data.id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      shippingAddress: data.shipping_address,
      shippingCity: data.shipping_city,
      shippingPostalCode: data.shipping_postal_code,
      shippingCountry: data.shipping_country,
      items: data.items,
      subtotal: data.subtotal,
      shippingCost: data.shipping_cost,
      total: data.total,
      status: data.status,
      paymentIntentId: data.payment_intent_id,
      stripeCustomerId: data.stripe_customer_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Unexpected error fetching order:', error)
    return null
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
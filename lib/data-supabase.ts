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

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
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

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
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
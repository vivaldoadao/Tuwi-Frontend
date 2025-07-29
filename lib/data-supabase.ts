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

export async function getAllBraiders(): Promise<Braider[]> {
  try {
    const { data, error } = await supabase
      .from('braiders')
      .select(`
        *,
        users!braiders_user_id_fkey(name, email),
        services(*)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching braiders:', error)
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
      totalReviews: braider.total_reviews || 0
    }))
  } catch (error) {
    console.error('Unexpected error fetching braiders:', error)
    return []
  }
}

export async function getBraiderById(id: string): Promise<Braider | null> {
  try {
    const { data, error } = await supabase
      .from('braiders')
      .select(`
        *,
        users!braiders_user_id_fkey(name, email),
        services(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching braider:', error)
      return null
    }

    return {
      id: data.id,
      name: data.users?.name || 'Nome não disponível',
      bio: data.bio || '',
      location: data.location,
      contactEmail: data.users?.email || '',
      contactPhone: data.contact_phone || '',
      profileImageUrl: '/placeholder.svg?height=200&width=200&text=Braider',
      services: data.services.map((service: any) => ({
        id: service.id,
        name: service.name,
        price: parseFloat(service.price),
        durationMinutes: service.duration_minutes,
        description: service.description || '',
        imageUrl: service.image_url || '/placeholder.svg'
      })),
      portfolioImages: data.portfolio_images || [],
      status: data.status,
      averageRating: parseFloat(data.average_rating) || 0,
      totalReviews: data.total_reviews || 0
    }
  } catch (error) {
    console.error('Unexpected error fetching braider:', error)
    return null
  }
}

export async function getFeaturedBraiders(): Promise<Braider[]> {
  try {
    const braiders = await getAllBraiders()
    return braiders
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 2)
  } catch (error) {
    console.error('Unexpected error fetching featured braiders:', error)
    return []
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
      totalReviews: braider.total_reviews || 0
    }))
  } catch (error) {
    console.error('Unexpected error searching braiders:', error)
    return []
  }
}
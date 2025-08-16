// ===================================
// TIPOS CENTRALIZADOS DO SISTEMA
// ===================================

// ============================================================================
// TIPOS BASE DO SISTEMA
// ============================================================================

export type UserRole = 'customer' | 'braider' | 'admin'
export type BraiderStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type BookingType = 'domicilio' | 'trancista'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type RatingStatus = 'active' | 'hidden' | 'flagged' | 'deleted'

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
  password_hash?: string
  verification_code?: string
  verification_code_expiry?: string
  email_verified: boolean
  reset_code?: string
  reset_code_expiry?: string
}

export interface Braider {
  id: string
  user_id: string
  bio: string
  location: string
  contact_phone: string
  status: BraiderStatus
  portfolio_images: string[]
  average_rating: number
  total_reviews: number
  created_at: string
  updated_at: string
  // Campos expandidos
  whatsapp?: string
  instagram?: string
  district?: string
  concelho?: string
  freguesia?: string
  address?: string
  postal_code?: string
  serves_home: boolean
  serves_studio: boolean
  serves_salon: boolean
  max_travel_distance?: number
  salon_name?: string
  salon_address?: string
  specialties?: string[]
  years_experience?: "iniciante" | "1-2" | "3-5" | "6-10" | "10+"
  certificates?: string
  min_price?: number
  max_price?: number
  weekly_availability?: Record<string, any>
  contact_email?: string
  name?: string
  profile_image_url?: string
}

export interface Service {
  id: string
  braider_id: string
  name: string
  price: number
  duration_minutes: number
  description: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  long_description?: string
  price: number
  images: string[]
  category: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_country: string
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  total: number
  status: OrderStatus
  payment_intent_id?: string
  stripe_customer_id?: string
  notes?: string
  created_at: string
  updated_at: string
  order_number: string
}

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export interface Booking {
  id: string
  service_id: string
  client_id?: string
  braider_id: string
  booking_date: string
  booking_time: string
  service_type: BookingType
  client_name: string
  client_email: string
  client_phone: string
  client_address?: string
  status: BookingStatus
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  braider_id: string
  client_id?: string
  booking_id?: string
  service_id?: string
  overall_rating: number
  quality_rating?: number
  punctuality_rating?: number
  communication_rating?: number
  professionalism_rating?: number
  review_title?: string
  review_text?: string
  client_name: string
  client_email: string
  review_images?: string[]
  status: RatingStatus
  is_verified: boolean
  flagged_reason?: string
  braider_response?: string
  braider_response_date?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// TIPOS ESTENDIDOS COM RATINGS
// ============================================================================

export interface BraiderWithRating extends Braider {
  averageRating: number
  totalReviews: number
  isAvailable: boolean
  ratingDistribution?: Record<string, number>
}

export interface ProductWithRating extends Product {
  averageRating: number
  totalReviews: number
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  isInStock: boolean
  verifiedReviews?: number
  helpfulVotes?: number
}

// ============================================================================
// TIPOS DE COMPONENTES (PROPS)
// ============================================================================

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

export interface TableAction<T> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: (item: T) => boolean
  show?: (item: T) => boolean
}

export interface TableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface BulkAction<T> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (selectedItems: T[]) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  disabled?: (selectedItems: T[]) => boolean
  confirmMessage?: string
}

export interface DataTableItem {
  id: string
  [key: string]: any
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface SortInfo {
  column: string
  direction: 'asc' | 'desc'
}

export interface FilterInfo {
  [key: string]: string | number | boolean | undefined
}

// ============================================================================
// TIPOS DE FORMULÁRIOS
// ============================================================================

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'file' | 'date' | 'time'
  placeholder?: string
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => string | undefined
  }
  options?: { value: string | number; label: string }[]
  disabled?: boolean
  help?: string
}

export interface FormConfig {
  title: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  initialData?: Record<string, any>
}

// ============================================================================
// TIPOS DE API
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

// ============================================================================
// TIPOS DE HOOKS
// ============================================================================

export interface UseTableDataOptions<T> {
  fetchFunction: (page: number, limit: number, filters?: FilterInfo) => Promise<PaginatedResponse<T>>
  initialLimit?: number
  dependencies?: any[]
}

export interface UseTableDataReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo
  sorting: SortInfo
  filters: FilterInfo
  selectedItems: T[]
  // Actions
  refresh: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSorting: (column: string, direction?: 'asc' | 'desc') => void
  setFilters: (filters: FilterInfo) => void
  setSelectedItems: (items: T[]) => void
  toggleSelection: (item: T) => void
  selectAll: () => void
  clearSelection: () => void
}

export interface UseFormOptions<T> {
  initialData?: Partial<T>
  validationSchema?: Record<string, any>
  onSubmit: (data: T) => Promise<void> | void
}

export interface UseFormReturn<T> {
  data: Partial<T>
  errors: Record<string, string>
  loading: boolean
  touched: Record<string, boolean>
  // Actions
  setValue: (field: keyof T, value: any) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field: keyof T) => void
  clearAllErrors: () => void
  validate: () => boolean
  validateField: (field: keyof T) => boolean
  submit: () => Promise<void>
  reset: () => void
  setData: (data: Partial<T>) => void
}

// ============================================================================
// TIPOS DE CONTEXTO
// ============================================================================

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export interface CartContextType {
  items: CartItem[]
  total: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

// ============================================================================
// TIPOS DE NOTIFICAÇÕES
// ============================================================================

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// EXPORTS ÚTEIS
// ============================================================================

export type * from './table'
export type * from './form'
export type * from './api'
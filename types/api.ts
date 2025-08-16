// ===================================
// TIPOS ESPECÍFICOS PARA API
// ===================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
  meta?: ApiMeta
}

export interface ApiMeta {
  timestamp: string
  requestId?: string
  version?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
  }
  performance?: {
    executionTime: number
    dbQueries: number
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
  timestamp?: string
  requestId?: string
  path?: string
  stack?: string
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
  retries?: number
  retryDelay?: number
  signal?: AbortSignal
}

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  interceptors?: {
    request?: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>
    response?: (response: any) => any | Promise<any>
    error?: (error: ApiError) => any | Promise<any>
  }
}

// Authentication types
export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  permissions?: string[]
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
  redirectUrl?: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: string
  metadata?: Record<string, any>
}

// Generic CRUD operations
export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  options?: {
    validate?: boolean
    notify?: boolean
  }
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<Omit<T, 'id' | 'created_at'>>
  options?: {
    validate?: boolean
    notify?: boolean
    merge?: boolean
  }
}

export interface DeleteRequest {
  id: string
  options?: {
    soft?: boolean
    cascade?: boolean
    notify?: boolean
  }
}

export interface ListRequest {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
  search?: string
  include?: string[]
  exclude?: string[]
}

export interface BulkRequest<T> {
  operation: 'create' | 'update' | 'delete'
  items: T[]
  options?: {
    validate?: boolean
    notify?: boolean
    stopOnError?: boolean
  }
}

// Upload types
export interface UploadRequest {
  file: File
  path?: string
  filename?: string
  metadata?: Record<string, any>
  options?: {
    compress?: boolean
    resize?: { width?: number; height?: number }
    generateThumbnail?: boolean
  }
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
  metadata?: Record<string, any>
  thumbnailUrl?: string
}

// Webhook types
export interface WebhookPayload<T = any> {
  event: string
  data: T
  timestamp: string
  signature?: string
  metadata?: Record<string, any>
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  active?: boolean
  retries?: number
  timeout?: number
}

// Rate limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Cache types
export interface CacheConfig {
  ttl?: number // Time to live in seconds
  tags?: string[]
  key?: string
  revalidate?: boolean
}

export interface CacheResponse<T> {
  data: T
  hit: boolean
  ttl: number
  tags: string[]
  timestamp: string
}

// Monitoring types
export interface ApiMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  successRate: number
  slowestEndpoint: string
  errorRate: number
  uptime: number
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn'
    time: string
    output?: string
  }>
  version: string
  uptime: number
}

// Search types
export interface SearchRequest {
  query: string
  filters?: Record<string, any>
  facets?: string[]
  highlight?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  took: number
  facets?: Record<string, Array<{ value: string; count: number }>>
  suggestions?: string[]
  highlights?: Record<string, string[]>
}

// Analytics types
export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp?: string
  context?: {
    userAgent?: string
    ip?: string
    referrer?: string
    page?: string
  }
}

export interface AnalyticsQuery {
  metric: string
  filters?: Record<string, any>
  groupBy?: string[]
  dateRange?: {
    start: string
    end: string
  }
  granularity?: 'hour' | 'day' | 'week' | 'month'
}

export interface AnalyticsResponse {
  metric: string
  value: number
  change?: number
  changePercent?: number
  data?: Array<{
    timestamp: string
    value: number
    dimensions?: Record<string, string>
  }>
}
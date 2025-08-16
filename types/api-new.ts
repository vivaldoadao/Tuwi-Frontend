// ===================================
// TIPOS ESPECÍFICOS PARA APIS
// ===================================

import { NextRequest, NextResponse } from 'next/server'

// Standard API Response Interface
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: string[]
  meta?: ApiMeta
}

// API Metadata
export interface ApiMeta {
  timestamp?: string
  requestId?: string
  version?: string
  pagination?: PaginationMeta
  rateLimit?: RateLimitMeta
}

// Pagination metadata
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasNext: boolean
  hasPrev: boolean
}

// Rate limiting metadata
export interface RateLimitMeta {
  limit: number
  remaining: number
  reset: number
}

// Paginated API Response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta & {
    pagination: PaginationMeta
  }
}

// API Error Types
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
  field?: string
  validation?: boolean
}

// Request Configuration
export interface ApiRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, any>
  signal?: AbortSignal
  timeout?: number
  retries?: number
}

// API Handler Types
export type ApiHandler = (
  request: NextRequest,
  context?: ApiContext
) => Promise<NextResponse>

export type ApiHandlerWithParams<T = any> = (
  request: NextRequest,
  context: { params: Promise<T> }
) => Promise<NextResponse>

// API Context
export interface ApiContext {
  user?: {
    id: string
    email: string
    role: string
    [key: string]: any
  }
  session?: any
  params?: Record<string, string>
  metadata?: Record<string, any>
}

// Middleware Types
export interface ApiMiddleware {
  name: string
  handler: (
    request: NextRequest,
    context: ApiContext
  ) => Promise<{ success: boolean; error?: string; context?: ApiContext }>
}

export interface AuthMiddlewareConfig {
  required?: boolean
  roles?: string[]
  permissions?: string[]
  allowAnonymous?: boolean
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
  skipIf?: (request: NextRequest) => boolean
}

export interface ValidationConfig {
  body?: any // Zod schema
  params?: any // Zod schema
  query?: any // Zod schema
  files?: {
    maxSize?: number
    allowedTypes?: string[]
    required?: boolean
  }
}

export interface CacheConfig {
  ttl: number // seconds
  key?: string
  tags?: string[]
  revalidate?: boolean
}

// API Route Options
export interface ApiRouteOptions {
  auth?: AuthMiddlewareConfig
  rateLimit?: RateLimitConfig
  validation?: ValidationConfig
  cache?: CacheConfig
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  }
  timeout?: number
  retries?: number
}

// Standard HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

// API Route Handler with Options
export interface ApiRouteHandler {
  method: HttpMethod
  handler: ApiHandler | ApiHandlerWithParams
  options?: ApiRouteOptions
}

// Standardized Error Codes
export enum ApiErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Business Logic Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FEATURE_DISABLED = 'FEATURE_DISABLED'
}

// Common Response Builders
export interface ResponseBuilder {
  success<T>(data: T, message?: string, meta?: ApiMeta): NextResponse
  error(error: string | ApiError, status?: number): NextResponse
  validationError(errors: Record<string, string>): NextResponse
  notFound(resource?: string): NextResponse
  unauthorized(message?: string): NextResponse
  forbidden(message?: string): NextResponse
  conflict(message?: string): NextResponse
  rateLimit(reset?: number): NextResponse
  paginated<T>(
    data: T[], 
    pagination: PaginationMeta, 
    message?: string
  ): NextResponse
}

// Logging Interface
export interface ApiLogger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: any): void
  debug(message: string, data?: any): void
}

// Metrics Interface
export interface ApiMetrics {
  timing(name: string, duration: number): void
  counter(name: string, value?: number): void
  gauge(name: string, value: number): void
  histogram(name: string, value: number): void
}

// Database Client Interface
export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>
  transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T>
}

// File Upload Types
export interface UploadedFile {
  name: string
  size: number
  type: string
  buffer: Buffer
  url?: string
}

export interface FileUploadConfig {
  maxSize: number
  allowedTypes: string[]
  destination: string
  generateFilename?: (originalName: string) => string
}

// WebSocket Types (for real-time features)
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  userId?: string
  roomId?: string
}

export interface WebSocketConnection {
  id: string
  userId?: string
  rooms: Set<string>
  lastPing: Date
}

// Background Job Types
export interface BackgroundJob {
  id: string
  type: string
  payload: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  error?: string
}

// Event Types for pub/sub
export interface SystemEvent {
  type: string
  payload: any
  source: string
  timestamp: Date
  metadata?: Record<string, any>
}
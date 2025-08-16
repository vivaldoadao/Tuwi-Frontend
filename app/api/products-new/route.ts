// ===================================
// PRODUCTS API - NOVA VERSÃO COM MIDDLEWARES
// ===================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createApiRoute } from '@/lib/api-middleware'
import { apiResponse, apiError, apiSuccess, withApiHandler } from '@/lib/api-response'
import type { ApiContext } from '@/types/api-new'

// Validation schemas
const getProductsSchema = z.object({
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  search: z.string().optional()
})

const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  longDescription: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  stockQuantity: z.number().int().min(0, 'Estoque não pode ser negativo'),
  images: z.array(z.string().url()).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true)
})

// Configure route with middlewares
const { middleware } = createApiRoute({
  auth: {
    required: false, // GET is public, POST requires auth
    allowAnonymous: true
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyGenerator: (req) => req.ip || 'anonymous'
  },
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
  }
})

// GET /api/products-new - Get all products with filtering and pagination
export const GET = withApiHandler(async (request: NextRequest) => {
  // Run middleware
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryObject = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validatedQuery = getProductsSchema.parse(queryObject)
    const { category, featured, limit = 20, page = 1, search } = validatedQuery

    const supabase = await createClient()
    
    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Database error fetching products:', error)
      return apiError.database('Erro ao buscar produtos', error)
    }

    const total = count || 0
    
    return apiSuccess.list(
      products || [],
      page,
      limit,
      total,
      `${total} produtos encontrados`
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {} as Record<string, string>)
      
      return apiResponse.validationError(errorMessages)
    }

    console.error('Unexpected error in GET /api/products-new:', error)
    return apiError.internal('Erro inesperado ao buscar produtos')
  }
})

// POST /api/products-new - Create new product (admin only)
export const POST = withApiHandler(async (request: NextRequest) => {
  // Run middleware with admin auth
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  const context = middlewareResult.context as ApiContext
  
  // Check if user is admin
  if (!context.user || context.user.role !== 'admin') {
    return apiResponse.forbidden('Apenas administradores podem criar produtos')
  }

  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createProductSchema.parse(body)

    const supabase = await createClient()
    
    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        ...validatedData,
        created_by: context.user.id,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error creating product:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return apiResponse.conflict('Produto com este nome já existe')
      }
      
      return apiError.database('Erro ao criar produto', error)
    }

    return apiSuccess.created(product, 'Produto criado com sucesso')

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {} as Record<string, string>)
      
      return apiResponse.validationError(errorMessages)
    }

    if (error instanceof SyntaxError) {
      return apiError.badRequest('Formato JSON inválido')
    }

    console.error('Unexpected error in POST /api/products-new:', error)
    return apiError.internal('Erro inesperado ao criar produto')
  }
})

// PUT /api/products-new - Update product (admin only)
export const PUT = withApiHandler(async (request: NextRequest) => {
  // Run middleware with admin auth
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  const context = middlewareResult.context as ApiContext
  
  // Check if user is admin
  if (!context.user || context.user.role !== 'admin') {
    return apiResponse.forbidden('Apenas administradores podem atualizar produtos')
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return apiError.badRequest('ID do produto é obrigatório')
    }
    
    // Validate update data (make all fields optional for updates)
    const updateSchema = createProductSchema.partial()
    const validatedData = updateSchema.parse(updateData)

    const supabase = await createClient()
    
    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...validatedData,
        updated_by: context.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating product:', error)
      
      if (error.code === 'PGRST116') { // No rows found
        return apiResponse.notFound('Produto')
      }
      
      return apiError.database('Erro ao atualizar produto', error)
    }

    return apiSuccess.updated(product, 'Produto atualizado com sucesso')

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {} as Record<string, string>)
      
      return apiResponse.validationError(errorMessages)
    }

    console.error('Unexpected error in PUT /api/products-new:', error)
    return apiError.internal('Erro inesperado ao atualizar produto')
  }
})

// DELETE /api/products-new - Delete product (admin only)
export const DELETE = withApiHandler(async (request: NextRequest) => {
  // Run middleware with admin auth
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  const context = middlewareResult.context as ApiContext
  
  // Check if user is admin
  if (!context.user || context.user.role !== 'admin') {
    return apiResponse.forbidden('Apenas administradores podem excluir produtos')
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return apiError.badRequest('ID do produto é obrigatório')
    }

    const supabase = await createClient()
    
    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        deleted_by: context.user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Database error deleting product:', error)
      return apiError.database('Erro ao excluir produto', error)
    }

    return apiSuccess.deleted('Produto excluído com sucesso')

  } catch (error) {
    console.error('Unexpected error in DELETE /api/products-new:', error)
    return apiError.internal('Erro inesperado ao excluir produto')
  }
})

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
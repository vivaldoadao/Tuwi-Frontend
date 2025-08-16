// ===================================
// PORTFOLIO UPLOAD API - USANDO NOVOS MIDDLEWARES
// ===================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createApiRoute } from '@/lib/api-middleware'
import { apiResponse, apiError, apiSuccess, withApiHandler } from '@/lib/api-response'
import { uploadPortfolioImageServer, updateBraiderPortfolioServer } from '@/lib/supabase-storage-server'
import { validatePortfolioFile, PORTFOLIO_CONFIG } from '@/lib/supabase-storage'
import { createClient } from '@/lib/supabase/server'
import type { ApiContext } from '@/types/api-new'

// Validation schemas
const uploadRequestSchema = z.object({
  braiderId: z.string().uuid('ID da trancista deve ser um UUID válido'),
  imagePosition: z.number().int().min(0).max(PORTFOLIO_CONFIG.MAX_IMAGES - 1).optional(),
  replaceExisting: z.boolean().default(false)
})

// Configure route with middlewares
const { middleware } = createApiRoute({
  auth: {
    required: true,
    allowAnonymous: false
  },
  rateLimit: {
    maxRequests: 10, // Limited uploads per minute
    windowMs: 60000,
    keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'anonymous'
  },
  cors: {
    origin: '*',
    methods: ['POST', 'DELETE', 'OPTIONS']
  }
})

// POST /api/braiders/portfolio/upload - Upload portfolio image
export const POST = withApiHandler(async (request: NextRequest) => {
  // Run middleware
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  const context = middlewareResult.context as ApiContext

  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    const requestData = {
      braiderId: formData.get('braiderId') as string,
      imagePosition: formData.get('imagePosition') ? parseInt(formData.get('imagePosition') as string) : undefined,
      replaceExisting: formData.get('replaceExisting') === 'true'
    }

    // Validate request data
    const validatedData = uploadRequestSchema.parse(requestData)

    // Validate file exists
    if (!file || !(file instanceof File)) {
      return apiError.badRequest('Arquivo de imagem é obrigatório')
    }

    // Validate file using portfolio validation
    const fileValidation = validatePortfolioFile(file, {
      userId: context.user!.id,
      maxSizeBytes: PORTFOLIO_CONFIG.MAX_SIZE_BYTES,
      allowedTypes: PORTFOLIO_CONFIG.ALLOWED_TYPES
    })

    if (!fileValidation.valid) {
      return apiError.badRequest(fileValidation.error!)
    }

    // Check if user has permission to upload to this braider profile
    const supabase = await createClient()
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, contact_email, portfolio_images')
      .eq('id', validatedData.braiderId)
      .single()

    if (braiderError || !braider) {
      return apiResponse.notFound('Trancista')
    }

    // Verify user owns this braider profile or is admin
    if (context.user!.role !== 'admin' && braider.contact_email !== context.user!.email) {
      return apiResponse.forbidden('Você só pode gerenciar seu próprio portfólio')
    }

    // Check portfolio image limit
    const currentImages = braider.portfolio_images || []
    if (!validatedData.replaceExisting && currentImages.length >= PORTFOLIO_CONFIG.MAX_IMAGES) {
      return apiError.badRequest(`Máximo de ${PORTFOLIO_CONFIG.MAX_IMAGES} imagens permitidas no portfólio`)
    }

    // Convert file to buffer for server upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload image to storage
    const uploadResult = await uploadPortfolioImageServer(
      buffer,
      file.name,
      {
        userId: context.user!.id,
        maxSizeBytes: PORTFOLIO_CONFIG.MAX_SIZE_BYTES,
        allowedTypes: PORTFOLIO_CONFIG.ALLOWED_TYPES
      }
    )

    if (!uploadResult.success || !uploadResult.data) {
      return apiError.internal(uploadResult.error || 'Erro no upload da imagem')
    }

    // Update portfolio images array
    let updatedImages = [...currentImages]
    
    if (validatedData.imagePosition !== undefined) {
      // Insert at specific position or replace
      if (validatedData.replaceExisting && updatedImages[validatedData.imagePosition]) {
        updatedImages[validatedData.imagePosition] = uploadResult.data.url
      } else {
        updatedImages.splice(validatedData.imagePosition, 0, uploadResult.data.url)
      }
    } else {
      // Add to end
      updatedImages.push(uploadResult.data.url)
    }

    // Ensure we don't exceed max images
    if (updatedImages.length > PORTFOLIO_CONFIG.MAX_IMAGES) {
      updatedImages = updatedImages.slice(0, PORTFOLIO_CONFIG.MAX_IMAGES)
    }

    // Update braider portfolio in database
    const updateResult = await updateBraiderPortfolioServer(
      validatedData.braiderId,
      updatedImages
    )

    if (!updateResult.success) {
      // If database update fails, try to clean up uploaded file
      // (In a real app, you might want to implement a cleanup job)
      return apiError.database(updateResult.error!)
    }

    return apiSuccess.created({
      imageUrl: uploadResult.data.url,
      imagePath: uploadResult.data.path,
      portfolioImages: updatedImages,
      position: validatedData.imagePosition || updatedImages.length - 1
    }, 'Imagem adicionada ao portfólio com sucesso')

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {} as Record<string, string>)
      
      return apiResponse.validationError(errorMessages)
    }

    console.error('Unexpected error in POST /api/braiders/portfolio/upload:', error)
    return apiError.internal('Erro inesperado no upload do portfólio')
  }
})

// DELETE /api/braiders/portfolio/upload - Remove portfolio image
export const DELETE = withApiHandler(async (request: NextRequest) => {
  // Run middleware
  const middlewareResult = await middleware(request)
  if (!middlewareResult.success) {
    return apiResponse.unauthorized(middlewareResult.error)
  }

  const context = middlewareResult.context as ApiContext

  try {
    const { searchParams } = new URL(request.url)
    const braiderId = searchParams.get('braiderId')
    const imageUrl = searchParams.get('imageUrl')
    const imagePosition = searchParams.get('imagePosition')

    if (!braiderId) {
      return apiError.badRequest('ID da trancista é obrigatório')
    }

    if (!imageUrl && imagePosition === null) {
      return apiError.badRequest('URL da imagem ou posição é obrigatória')
    }

    // Get braider and verify permissions
    const supabase = await createClient()
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, contact_email, portfolio_images')
      .eq('id', braiderId)
      .single()

    if (braiderError || !braider) {
      return apiResponse.notFound('Trancista')
    }

    // Verify user owns this braider profile or is admin
    if (context.user!.role !== 'admin' && braider.contact_email !== context.user!.email) {
      return apiResponse.forbidden('Você só pode gerenciar seu próprio portfólio')
    }

    const currentImages = braider.portfolio_images || []
    let updatedImages = [...currentImages]
    let removedImageUrl: string | null = null

    // Remove image by position or URL
    if (imagePosition !== null) {
      const position = parseInt(imagePosition)
      if (position >= 0 && position < updatedImages.length) {
        removedImageUrl = updatedImages[position]
        updatedImages.splice(position, 1)
      } else {
        return apiError.badRequest('Posição da imagem inválida')
      }
    } else if (imageUrl) {
      const index = updatedImages.findIndex(img => img === imageUrl)
      if (index !== -1) {
        removedImageUrl = updatedImages[index]
        updatedImages.splice(index, 1)
      } else {
        return apiResponse.notFound('Imagem não encontrada no portfólio')
      }
    }

    if (!removedImageUrl) {
      return apiResponse.notFound('Imagem não encontrada')
    }

    // Update braider portfolio in database
    const updateResult = await updateBraiderPortfolioServer(braiderId, updatedImages)

    if (!updateResult.success) {
      return apiError.database(updateResult.error!)
    }

    // TODO: Implement cleanup of storage file
    // For now, we'll leave the file in storage but remove from portfolio
    // A background job should clean up unused files

    return apiSuccess.deleted('Imagem removida do portfólio com sucesso')

  } catch (error) {
    console.error('Unexpected error in DELETE /api/braiders/portfolio/upload:', error)
    return apiError.internal('Erro inesperado ao remover imagem do portfólio')
  }
})

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
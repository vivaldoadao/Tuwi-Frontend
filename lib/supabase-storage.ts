// ===================================
// SUPABASE STORAGE UTILITIES
// ===================================

import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  data?: {
    url: string
    path: string
    fullPath: string
  }
  error?: string
}

export interface PortfolioUploadOptions {
  userId: string
  maxSizeBytes?: number
  allowedTypes?: string[]
  generateThumbnail?: boolean
}

// Client-side upload function
export async function uploadPortfolioImage(
  file: File,
  options: PortfolioUploadOptions
): Promise<UploadResult> {
  try {
    const supabase = createClient()
    
    // Validate file
    const validation = validatePortfolioFile(file, options)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${options.userId}/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(filePath, file, {
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600' // Cache for 1 hour
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        fullPath: data.path
      }
    }

  } catch (error) {
    console.error('Upload portfolio image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Note: Server-side functions moved to supabase-storage-server.ts to avoid Next.js build issues

// Delete portfolio image
export async function deletePortfolioImage(filePath: string): Promise<UploadResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from('portfolio-images')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return {
        success: false,
        error: `Erro ao deletar: ${error.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Delete portfolio image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Server-side delete function moved to supabase-storage-server.ts

// Validate portfolio file
export function validatePortfolioFile(
  file: File,
  options: PortfolioUploadOptions
): { valid: boolean; error?: string } {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  } = options

  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedTypesStr = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ')
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypesStr}`
    }
  }

  // Check if file is actually an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Arquivo deve ser uma imagem'
    }
  }

  return { valid: true }
}

// Get content type from file extension
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }

  return contentTypes[extension] || 'image/jpeg'
}

// Get file path from URL
export function getFilePathFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/portfolio-images\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Update braider portfolio images in database
export async function updateBraiderPortfolio(
  braiderId: string,
  portfolioUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('braiders')
      .update({ portfolio_images: portfolioUrls })
      .eq('id', braiderId)

    if (error) {
      console.error('Database update error:', error)
      return {
        success: false,
        error: `Erro ao atualizar portfólio: ${error.message}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Update braider portfolio error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Server-side update function moved to supabase-storage-server.ts

// Bulk upload multiple images
export async function uploadMultiplePortfolioImages(
  files: File[],
  options: PortfolioUploadOptions
): Promise<{
  success: boolean
  results: UploadResult[]
  successCount: number
  failureCount: number
}> {
  const results: UploadResult[] = []
  let successCount = 0
  let failureCount = 0

  // Upload files sequentially to avoid overwhelming the server
  for (const file of files) {
    const result = await uploadPortfolioImage(file, options)
    results.push(result)
    
    if (result.success) {
      successCount++
    } else {
      failureCount++
    }
  }

  return {
    success: successCount > 0,
    results,
    successCount,
    failureCount
  }
}

// Constants
export const PORTFOLIO_CONFIG = {
  MAX_IMAGES: 10,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  BUCKET_NAME: 'portfolio-images'
} as const
// ===================================
// SUPABASE STORAGE SERVER UTILITIES
// ===================================

import { createClient } from '@/lib/supabase/server'
import { PORTFOLIO_CONFIG, type UploadResult, type PortfolioUploadOptions } from '@/lib/supabase-storage'

// Server-side upload function (for API routes)
export async function uploadPortfolioImageServer(
  file: Buffer,
  fileName: string,
  options: PortfolioUploadOptions
): Promise<UploadResult> {
  try {
    const supabase = await createClient()

    // Generate unique filename
    const fileExt = fileName.split('.').pop()?.toLowerCase()
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${options.userId}/${uniqueFileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(filePath, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: getContentType(fileExt || '')
      })

    if (error) {
      console.error('Server storage upload error:', error)
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
    console.error('Server upload portfolio image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Server-side delete
export async function deletePortfolioImageServer(filePath: string): Promise<UploadResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.storage
      .from('portfolio-images')
      .remove([filePath])

    if (error) {
      console.error('Server storage delete error:', error)
      return {
        success: false,
        error: `Erro ao deletar: ${error.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Server delete portfolio image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Server-side update
export async function updateBraiderPortfolioServer(
  braiderId: string,
  portfolioUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('braiders')
      .update({ portfolio_images: portfolioUrls })
      .eq('id', braiderId)

    if (error) {
      console.error('Server database update error:', error)
      return {
        success: false,
        error: `Erro ao atualizar portfólio: ${error.message}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Server update braider portfolio error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
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
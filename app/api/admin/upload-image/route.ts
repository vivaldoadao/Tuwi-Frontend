import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Admin check using existing auth system
async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// POST /api/admin/upload-image - Upload de imagem para o CMS
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'cms'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF' 
      }, { status: 400 })
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 5MB permitido' 
      }, { status: 400 })
    }

    const serviceClient = getServiceClient()
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${folder}/${timestamp}-${randomSuffix}.${fileExtension}`

    // Converter File para ArrayBuffer
    const fileBuffer = await file.arrayBuffer()
    
    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Erro ao fazer upload da imagem' 
      }, { status: 500 })
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = serviceClient.storage
      .from('images')
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData.publicUrl

    // Salvar metadados na tabela site_media
    const { data: mediaRecord, error: mediaError } = await serviceClient
      .from('site_media')
      .insert({
        filename: fileName,
        original_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        width: null, // Podemos adicionar detecção de dimensões depois
        height: null,
        is_active: true,
        uploaded_by: session.user.id
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Database insert error:', mediaError)
      // Tentar deletar a imagem do storage se falhou salvar no DB
      await serviceClient.storage.from('images').remove([fileName])
      return NextResponse.json({ 
        error: 'Erro ao salvar metadados da imagem' 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Upload realizado com sucesso',
      media: mediaRecord,
      url: publicUrl,
      fileName: fileName
    })

  } catch (error) {
    console.error('Error in image upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/upload-image - Listar imagens do CMS
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const folder = url.searchParams.get('folder')

    let query = serviceClient
      .from('site_media')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (folder) {
      query = query.ilike('filename', `${folder}%`)
    }

    const { data: media, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching media:', error)
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
    }

    return NextResponse.json({ media })

  } catch (error) {
    console.error('Error in media GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
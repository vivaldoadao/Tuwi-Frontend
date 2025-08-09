import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Server-side service client with admin privileges to bypass RLS
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': { ext: '.jpg', category: 'image' },
  'image/png': { ext: '.png', category: 'image' },
  'image/gif': { ext: '.gif', category: 'image' },
  'image/webp': { ext: '.webp', category: 'image' },
  'application/pdf': { ext: '.pdf', category: 'document' },
  'text/plain': { ext: '.txt', category: 'document' },
  'application/msword': { ext: '.doc', category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', category: 'document' }
}

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting message file upload API...')
    
    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conversationId = formData.get('conversationId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'ID da conversa é obrigatório' },
        { status: 400 }
      )
    }

    console.log('📁 File upload request:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      conversationId
    })

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande (máximo 10MB)' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS
    const serviceSupabase = getServiceClient()

    // Get current user ID
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === userData.id || 
                         conversation.participant_2_id === userData.id

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para fazer upload nesta conversa' },
        { status: 403 }
      )
    }

    // Generate safe file path
    const timestamp = Date.now()
    const fileInfo = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `conversations/${conversationId}/${userData.id}/${timestamp}_${safeFilename}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('chat-files')
      .upload(filePath, fileBytes, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded successfully:', uploadData.path)

    // Get public URL (for signed URLs, we'll implement later)
    const { data: urlData } = await serviceSupabase.storage
      .from('chat-files')
      .createSignedUrl(filePath, 3600) // 1 hour

    const fileUrl = urlData?.signedUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${filePath}`

    // Return file information
    const fileMetadata = {
      id: uploadData.path,
      filename: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      category: fileInfo.category,
      url: fileUrl,
      path: filePath,
      conversationId,
      uploadedBy: userData.id,
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata,
      message: 'Arquivo enviado com sucesso'
    })

  } catch (error) {
    console.error('💥 Unexpected error in file upload API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get file URL for download/preview
    const url = new URL(request.url)
    const filePath = url.searchParams.get('path')
    const action = url.searchParams.get('action') || 'view' // view or download

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Get the current user session
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const serviceSupabase = getServiceClient()

    // Get current user ID
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Extract conversation ID from file path
    const pathParts = filePath.split('/')
    if (pathParts.length < 3 || pathParts[0] !== 'conversations') {
      return NextResponse.json(
        { success: false, error: 'Caminho de arquivo inválido' },
        { status: 400 }
      )
    }

    const conversationId = pathParts[1]

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === userData.id || 
                         conversation.participant_2_id === userData.id

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para acessar este arquivo' },
        { status: 403 }
      )
    }

    // Generate signed URL
    const expiresIn = action === 'download' ? 300 : 3600 // 5 minutes for download, 1 hour for view
    const { data: urlData, error: urlError } = await serviceSupabase.storage
      .from('chat-files')
      .createSignedUrl(filePath, expiresIn)

    if (urlError || !urlData?.signedUrl) {
      console.error('❌ Error creating signed URL:', urlError)
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar URL do arquivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: urlData.signedUrl,
      expiresIn,
      action
    })

  } catch (error) {
    console.error('💥 Unexpected error in file URL API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Starting profile image upload...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email é obrigatório' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'Arquivo muito grande. Máximo 5MB.' 
      }, { status: 400 })
    }

    const serviceSupabase = getServiceClient()
    
    // Find user by email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `profile-${userData.id}-${timestamp}.${fileExtension}`
    const filePath = `profiles/${fileName}`
    
    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('📤 Uploading to Supabase Storage:', filePath)
    
    // Get current profile image to delete old one
    const { data: currentBraider } = await serviceSupabase
      .from('braiders')
      .select('profile_image_url')
      .eq('user_id', userData.id)
      .single()
    
    // Upload to Supabase Storage
    const { error: uploadError } = await serviceSupabase.storage
      .from('profile-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Replace if exists
      })
    
    if (uploadError) {
      console.error('❌ Supabase storage upload error:', uploadError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro no upload da imagem: ' + uploadError.message 
      }, { status: 500 })
    }
    
    // Get public URL from Supabase Storage
    const { data: urlData } = serviceSupabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)
    
    const publicUrl = urlData.publicUrl
    
    console.log('✅ File uploaded to Supabase:', publicUrl)
    
    // Update braider profile with new image URL
    console.log('🔄 Updating braider profile for user:', userData.id)
    const { error: updateError } = await serviceSupabase
      .from('braiders')
      .update({ 
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userData.id)
    
    if (updateError) {
      console.error('❌ Error updating braider profile:', updateError)
      console.error('❌ Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar perfil com nova imagem: ' + updateError.message,
        error: updateError
      }, { status: 500 })
    }
    
    console.log('✅ Braider profile updated with new image')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Foto de perfil atualizada com sucesso!',
      imageUrl: publicUrl
    })
    
  } catch (error) {
    console.error('💥 Error uploading profile image:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado no upload da imagem',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
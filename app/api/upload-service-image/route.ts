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
    console.log('🖼️ Starting service image upload...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string
    const serviceId = formData.get('serviceId') as string
    
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

    // Find braider by user_id
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id')
      .eq('user_id', userData.id)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // If serviceId is provided, verify service belongs to this braider
    if (serviceId) {
      const { data: serviceData, error: serviceError } = await serviceSupabase
        .from('services')
        .select('id')
        .eq('id', serviceId)
        .eq('braider_id', braiderData.id)
        .single()
      
      if (serviceError || !serviceData) {
        return NextResponse.json({ 
          success: false, 
          message: 'Serviço não encontrado ou não autorizado' 
        }, { status: 404 })
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = serviceId 
      ? `service-${serviceId}-${timestamp}.${fileExtension}`
      : `service-temp-${braiderData.id}-${timestamp}.${fileExtension}`
    const filePath = `services/${fileName}`
    
    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('📤 Uploading service image to Supabase Storage:', filePath)
    
    // Upload to Supabase Storage
    const { error: uploadError } = await serviceSupabase.storage
      .from('service-images')
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
      .from('service-images')
      .getPublicUrl(filePath)
    
    const publicUrl = urlData.publicUrl
    
    console.log('✅ Service image uploaded to Supabase:', publicUrl)
    
    // If serviceId is provided, update the service with the new image URL
    if (serviceId) {
      console.log('🔄 Updating service with new image URL:', serviceId)
      const { error: updateError } = await serviceSupabase
        .from('services')
        .update({ 
          image_url: publicUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', serviceId)
      
      if (updateError) {
        console.error('❌ Error updating service with image:', updateError)
        return NextResponse.json({ 
          success: false, 
          message: 'Erro ao atualizar serviço com nova imagem: ' + updateError.message,
          imageUrl: publicUrl // Still return the URL even if update failed
        }, { status: 500 })
      }
      
      console.log('✅ Service updated with new image')
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Imagem do serviço enviada com sucesso!',
      imageUrl: publicUrl
    })
    
  } catch (error) {
    console.error('💥 Error uploading service image:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado no upload da imagem',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
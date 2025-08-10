import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // For now, we'll skip authentication to get the upload working
    // In production, you should implement proper authentication
    const userEmail = request.headers.get('x-user-email') || 'test@example.com'

    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo inválido. Apenas imagens são permitidas.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB permitido.' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique file name
    const fileExtension = file.name.split('.').pop()
    const fileName = `avatars/${userEmail}_${Date.now()}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl

    // Update user record in database
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('email', userEmail)

    if (dbError) {
      console.error('❌ Error updating user record in database:', dbError)
      return NextResponse.json(
        { success: false, error: 'Avatar uploaded but failed to update database record' },
        { status: 500 }
      )
    } else {
      console.log('✅ Avatar uploaded and database updated successfully')
    }

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl,
      message: 'Avatar atualizado com sucesso!'
    })

  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
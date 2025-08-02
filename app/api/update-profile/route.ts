import { NextRequest, NextResponse } from 'next/server'
import { updateUserProfile } from '@/lib/data-supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, updates } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dados para atualização são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validate and sanitize updates
    const allowedFields = ['name', 'phone']
    const sanitizedUpdates: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        // Additional validation per field
        if (key === 'name') {
          const name = String(value).trim()
          if (name.length < 2 || name.length > 100) {
            return NextResponse.json(
              { success: false, error: 'Nome deve ter entre 2 e 100 caracteres' },
              { status: 400 }
            )
          }
          sanitizedUpdates[key] = name
        } else if (key === 'phone') {
          const phone = String(value).trim()
          if (phone && (phone.length < 8 || phone.length > 20)) {
            return NextResponse.json(
              { success: false, error: 'Telefone deve ter entre 8 e 20 caracteres' },
              { status: 400 }
            )
          }
          sanitizedUpdates[key] = phone || null
        }
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      )
    }

    console.log('🔄 API: Updating user profile:', { email, sanitizedUpdates })

    // Update user profile
    const result = await updateUserProfile(email.trim().toLowerCase(), sanitizedUpdates)
    
    if (result.success) {
      console.log('✅ API: User profile updated successfully')
      return NextResponse.json({
        success: true,
        message: 'Perfil atualizado com sucesso'
      })
    } else {
      console.error('❌ API: Failed to update profile:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ API: Unexpected error in update-profile:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, USER_ROLES, type UserRole } from '@/lib/roles'
import { z } from 'zod'

const updateRoleSchema = z.object({
  userId: z.string().uuid('User ID deve ser um UUID válido'),
  role: z.enum(['customer', 'braider', 'admin'])
})

// PUT /api/users/role - Update user role (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    // Only admins can update user roles
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar roles.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = updateRoleSchema.parse(body)

    const supabase = await createClient()
    
    // Update user role
    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar role do usuário' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // If role is changed to braider, ensure braider profile exists
    if (role === USER_ROLES.BRAIDER) {
      const { data: braiderProfile } = await supabase
        .from('braiders')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!braiderProfile) {
        // Create braider profile
        const { error: braiderError } = await supabase
          .from('braiders')
          .insert({
            user_id: userId,
            bio: 'Nova trancista na plataforma',
            location: 'A definir',
            status: 'pending'
          })

        if (braiderError) {
          console.error('Error creating braider profile:', braiderError)
        }
      }
    }

    return NextResponse.json({ 
      user,
      message: `Role atualizado para ${role} com sucesso!` 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /api/users/role/[userId] - Get user role (admin only or self)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    // Users can only get their own role, admins can get any
    if (!isAdmin(session) && session?.user?.id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
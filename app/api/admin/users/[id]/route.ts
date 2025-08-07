import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// DELETE /api/admin/users/[id] - Delete user (admin only) - FOR TESTING CASCADE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const userId = resolvedParams.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    const serviceSupabase = getServiceClient()

    // Get user data first for logging
    const { data: userData, error: fetchError } = await serviceSupabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user data:', fetchError)
      if (fetchError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      )
    }

    // Check if user has braider profile before deletion for logging
    const { data: braiderData } = await serviceSupabase
      .from('braiders')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    console.log('=== TESTING CASCADE DELETION ===')
    console.log('User to delete:', userData)
    console.log('Braider profile found:', braiderData ? 'Yes' : 'No')
    if (braiderData) {
      console.log('Braider data:', braiderData)
    }

    // Delete user - this should cascade to braiders table
    const { error: deleteError } = await serviceSupabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      )
    }

    // Verify cascade deletion worked
    if (braiderData) {
      const { data: verifyBraider } = await serviceSupabase
        .from('braiders')
        .select('id')
        .eq('id', braiderData.id)
        .single()

      console.log('Braider profile after deletion:', verifyBraider ? 'Still exists (ERROR!)' : 'Deleted (SUCCESS!)')
    }

    console.log('✅ User deleted successfully. Cascade should have removed braider profile.')
    console.log('=== END CASCADE TEST ===')

    return NextResponse.json({ 
      success: true, 
      message: `Usuário ${userData.name} foi deletado com sucesso. ${braiderData ? 'Perfil de trancista foi removido automaticamente.' : ''}`,
      cascadeTest: {
        userDeleted: true,
        hadBraiderProfile: !!braiderData,
        braiderId: braiderData?.id || null
      }
    })
  } catch (error) {
    console.error('Unexpected error deleting user:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
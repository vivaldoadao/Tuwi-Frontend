import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * API para setup inicial do sistema de promoções
 * Temporariamente desabilitada para compatibilidade com build
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({
      message: 'Setup route temporarily disabled for build compatibility',
      note: 'Please run SQL scripts manually via Supabase dashboard'
    })

  } catch (error) {
    console.error('Error in setup route:', error)
    return NextResponse.json({
      success: false,
      error: 'Setup failed'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin/users/[id]/status - Toggle user active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to Django API
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/admin/users/${id}/status/`, {
      method: 'PATCH',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      }
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao alterar status do usuário' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Admin user status toggle API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
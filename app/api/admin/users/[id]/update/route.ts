import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin/users/[id]/update - Update user basic information
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to Django API
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/admin/users/${id}/update/`, {
      method: 'PATCH',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao atualizar usuário' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Admin user update API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
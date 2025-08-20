import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/users/[id] - Get user details
export async function GET(
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
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/admin/users/${id}/`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      }
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao buscar detalhes do usuário' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Admin user detail API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user with cascade test
export async function DELETE(
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
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/admin/users/${id}/delete/`, {
      method: 'DELETE',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      }
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao deletar usuário' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Admin user delete API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { redirect_uri, state } = body

    // Forward request to Django API
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/oauth/google/url/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        redirect_uri: redirect_uri,
        state
      })
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao gerar URL de autenticação Google' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Google OAuth URL error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
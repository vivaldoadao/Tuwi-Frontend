import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, id_token, access_token } = body

    if (!code && !id_token && !access_token) {
      return NextResponse.json(
        { error: 'Código de autorização, ID token ou access token é obrigatório' },
        { status: 400 }
      )
    }

    // Forward request to Django API
    const djangoResponse = await fetch(`${process.env.DJANGO_API_URL}/auth/oauth/google/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        id_token,
        access_token
      })
    })

    const data = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro na autenticação com Google' },
        { status: djangoResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const verifySchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = verifySchema.parse(body)

    // Get user with reset code
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, reset_code, reset_code_expiry')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check if code exists and is not expired
    if (!user.reset_code || !user.reset_code_expiry) {
      return NextResponse.json(
        { error: 'Código de reset não encontrado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiryDate = new Date(user.reset_code_expiry)

    if (now > expiryDate) {
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Verify code
    if (user.reset_code !== code) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Código verificado com sucesso'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
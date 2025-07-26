import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendEmailVerification } from '@/lib/email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resendSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendSchema.parse(body)

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Este email já foi verificado' },
        { status: 400 }
      )
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Update user with new verification code
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: verificationCode,
        verification_code_expiry: verificationCodeExpiry.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating verification code:', updateError)
      return NextResponse.json(
        { error: 'Erro ao reenviar código' },
        { status: 500 }
      )
    }

    // Send verification email
    const emailSent = await sendEmailVerification(user.email, user.name, verificationCode)
    
    if (!emailSent) {
      console.warn(`Failed to resend verification email to ${email}`)
    }
    
    // In development, also log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`New verification code for ${email}: ${verificationCode}`)
      console.log(`Code expires at: ${verificationCodeExpiry.toLocaleString()}`)
    }

    return NextResponse.json({
      message: 'Novo código de verificação enviado para seu email.',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
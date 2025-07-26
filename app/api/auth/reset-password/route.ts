import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
})

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetSchema.parse(body)

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'Se o email estiver cadastrado, você receberá um código de verificação.'
      })
    }

    // Generate 6-digit code
    const resetCode = generateVerificationCode()
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save code to database
    const { error } = await supabase
      .from('users')
      .update({
        reset_code: resetCode,
        reset_code_expiry: resetCodeExpiry.toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error saving reset code:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Send email with verification code
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetCode)
    
    if (!emailSent) {
      console.warn(`Failed to send email to ${email}, but continuing...`)
    }
    
    // In development, also log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset code for ${email}: ${resetCode}`)
      console.log(`Code expires at: ${resetCodeExpiry.toLocaleString()}`)
    }

    return NextResponse.json({
      message: 'Se o email estiver cadastrado, você receberá um código de verificação.',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code: resetCode })
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
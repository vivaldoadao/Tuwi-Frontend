import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendEmailVerification } from '@/lib/email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Create user (not verified yet)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: 'customer',
        email_verified: false,
        verification_code: verificationCode,
        verification_code_expiry: verificationCodeExpiry.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // Send verification email
    const emailSent = await sendEmailVerification(newUser.email, newUser.name, verificationCode)
    
    if (!emailSent) {
      console.warn(`Failed to send verification email to ${email}`)
    }
    
    // In development, also log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verification code for ${email}: ${verificationCode}`)
      console.log(`Code expires at: ${verificationCodeExpiry.toLocaleString()}`)
    }

    return NextResponse.json({
      message: 'Conta criada! Verifique seu email para ativar a conta.',
      requiresVerification: true,
      email: newUser.email,
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

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
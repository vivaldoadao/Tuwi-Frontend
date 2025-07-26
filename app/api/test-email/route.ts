import { NextRequest, NextResponse } from 'next/server'
import { 
  testEmailConnection, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  sendWelcomeEmail,
  sendOrderConfirmationEmail 
} from '@/lib/email-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const email = searchParams.get('email') || 'test@example.com'
  const name = searchParams.get('name') || 'Usuário Teste'

  try {
    switch (action) {
      case 'connection':
        const isConnected = await testEmailConnection()
        return NextResponse.json({ 
          success: isConnected, 
          message: isConnected ? 'Email service is working!' : 'Email service connection failed' 
        })

      case 'reset':
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const resetSent = await sendPasswordResetEmail(email, name, code)
        return NextResponse.json({ 
          success: resetSent, 
          message: resetSent ? 'Password reset email sent!' : 'Failed to send password reset email',
          code: process.env.NODE_ENV === 'development' ? code : undefined
        })

      case 'verification':
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
        const verifySent = await sendEmailVerification(email, name, verifyCode)
        return NextResponse.json({ 
          success: verifySent, 
          message: verifySent ? 'Verification email sent!' : 'Failed to send verification email',
          code: process.env.NODE_ENV === 'development' ? verifyCode : undefined
        })

      case 'welcome':
        const welcomeSent = await sendWelcomeEmail(email, name)
        return NextResponse.json({ 
          success: welcomeSent, 
          message: welcomeSent ? 'Welcome email sent!' : 'Failed to send welcome email' 
        })

      case 'order':
        const orderSent = await sendOrderConfirmationEmail(email, name)
        return NextResponse.json({ 
          success: orderSent, 
          message: orderSent ? 'Order confirmation email sent!' : 'Failed to send order confirmation email' 
        })

      default:
        return NextResponse.json({
          message: 'Email Testing API',
          usage: {
            'Test connection': '/api/test-email?action=connection',
            'Test password reset': '/api/test-email?action=reset&email=test@example.com&name=João',
            'Test verification': '/api/test-email?action=verification&email=test@example.com&name=João',
            'Test welcome': '/api/test-email?action=welcome&email=test@example.com&name=João',
            'Test order': '/api/test-email?action=order&email=test@example.com&name=João'
          }
        })
    }
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import nodemailer from 'nodemailer'
import { passwordResetTemplate, emailVerificationTemplate, welcomeTemplate, orderConfirmationTemplate } from './email-templates'

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
})

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify()
    console.log('✅ Email server connection verified')
    return true
  } catch (error) {
    console.error('❌ Email server connection failed:', error)
    return false
  }
}

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  code: string
): Promise<boolean> => {
  try {
    const htmlContent = passwordResetTemplate({ userName, code })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: '🔐 Código para redefinir sua senha - Wilnara Tranças',
      html: htmlContent,
      text: `Olá, ${userName}!\n\nUse o código ${code} para redefinir sua senha.\nEste código expira em 15 minutos.\n\nSe você não solicitou esta alteração, ignore este email.\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Password reset email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error)
    return false
  }
}

// Send email verification
export const sendEmailVerification = async (
  email: string,
  userName: string,
  code: string
): Promise<boolean> => {
  try {
    const htmlContent = emailVerificationTemplate({ userName, code })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: '✅ Confirme seu email - Wilnara Tranças',
      html: htmlContent,
      text: `Olá, ${userName}!\n\nBem-vindo(a) à Wilnara Tranças!\n\nUse o código ${code} para verificar seu email.\nEste código expira em 30 minutos.\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email verification sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send email verification:', error)
    return false
  }
}

// Send welcome email
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<boolean> => {
  try {
    const htmlContent = welcomeTemplate({ userName })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: '🌟 Bem-vindo(a) à Wilnara Tranças!',
      html: htmlContent,
      text: `Olá, ${userName}!\n\nSeja bem-vindo(a) à Wilnara Tranças!\n\nSua conta foi criada com sucesso. Agora você pode explorar nossos produtos e serviços.\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Welcome email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    return false
  }
}

// Send order confirmation email with detailed order information
export const sendOrderConfirmationEmail = async (
  email: string,
  userName: string,
  orderDetails: {
    orderId: string
    customerName: string
    items: {
      productName: string
      productPrice: number
      quantity: number
      subtotal: number
      productImage?: string
    }[]
    subtotal: number
    shippingCost: number
    total: number
    shippingAddress: string
    shippingCity: string
    shippingPostalCode: string
    shippingCountry: string
    orderDate: string
    paymentIntentId?: string
  }
): Promise<boolean> => {
  try {
    const htmlContent = orderConfirmationTemplate({ userName, orderDetails })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `📦 Pedido #${orderDetails.orderId.slice(0, 8).toUpperCase()} confirmado - Wilnara Tranças`,
      html: htmlContent,
      text: `Olá, ${userName}!\n\nSeu pedido #${orderDetails.orderId.slice(0, 8).toUpperCase()} foi confirmado com sucesso!\n\nTotal: €${orderDetails.total.toFixed(2)}\nData: ${orderDetails.orderDate}\n\nEstamos preparando tudo com muito carinho para você.\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Order confirmation email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error)
    return false
  }
}

// Generic email sender
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '') // Strip HTML if no text provided
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}
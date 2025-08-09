import nodemailer from 'nodemailer'
import { passwordResetTemplate, emailVerificationTemplate, welcomeTemplate, orderConfirmationTemplate, orderTrackingTemplate, braiderApprovedTemplate, braiderRejectedTemplate, bookingConfirmedTemplate, bookingRejectedTemplate } from './email-templates'

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

// Send order tracking notification email
export const sendOrderTrackingEmail = async (
  email: string,
  userName: string,
  orderDetails: {
    orderId: string
    customerName: string
    total: number
    status: string
  },
  trackingEvent: {
    title: string
    description?: string
    location?: string
    trackingNumber?: string
    eventType: string
    createdAt: string
  }
): Promise<boolean> => {
  try {
    const htmlContent = orderTrackingTemplate({ userName, orderDetails, trackingEvent })
    
    // Get email subject with appropriate emoji
    let subjectEmoji = '📋'
    switch (trackingEvent.eventType) {
      case 'order_created': subjectEmoji = '📦'; break
      case 'payment_confirmed': subjectEmoji = '💳'; break
      case 'processing_started': subjectEmoji = '⚙️'; break
      case 'shipped': subjectEmoji = '🚚'; break
      case 'out_for_delivery': subjectEmoji = '🛵'; break
      case 'delivered': subjectEmoji = '✅'; break
      case 'cancelled': subjectEmoji = '❌'; break
      case 'returned': subjectEmoji = '↩️'; break
      case 'refunded': subjectEmoji = '💰'; break
    }
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `${subjectEmoji} ${trackingEvent.title} - Pedido #${orderDetails.orderId.slice(0, 8).toUpperCase()} - Wilnara Tranças`,
      html: htmlContent,
      text: `Olá, ${userName}!\n\n${trackingEvent.title}\n\nPedido: #${orderDetails.orderId.slice(0, 8).toUpperCase()}\n${trackingEvent.description ? `\n${trackingEvent.description}` : ''}\n${trackingEvent.location ? `\nLocalização: ${trackingEvent.location}` : ''}\n${trackingEvent.trackingNumber ? `\nCódigo de rastreamento: ${trackingEvent.trackingNumber}` : ''}\n\nAcompanhe seu pedido em: ${process.env.NEXTAUTH_URL}/track-order\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Order tracking email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send order tracking email:', error)
    return false
  }
}

// Send braider approval notification email
export const sendBraiderApprovalEmail = async (
  email: string,
  braiderName: string,
  submissionDate?: string,
  reviewDate?: string
): Promise<boolean> => {
  try {
    const htmlContent = braiderApprovedTemplate({ 
      braiderName, 
      status: 'approved',
      submissionDate,
      reviewDate
    })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: '🎉 Parabéns! Sua solicitação foi aprovada - Wilnara Tranças',
      html: htmlContent,
      text: `Olá, ${braiderName}!\n\nParabéns! Sua solicitação para se tornar uma trancista parceira da Wilnara Tranças foi APROVADA!\n\nBem-vinda à nossa equipe! Agora você pode fazer login e começar a receber clientes.\n\n🔑 Faça login: ${process.env.NEXTAUTH_URL}/login\n📊 Acesse seu dashboard: ${process.env.NEXTAUTH_URL}/braider-dashboard\n\nEstamos animados para tê-la conosco!\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Braider approval email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send braider approval email:', error)
    return false
  }
}

// Send braider rejection notification email
export const sendBraiderRejectionEmail = async (
  email: string,
  braiderName: string,
  reason?: string,
  submissionDate?: string,
  reviewDate?: string
): Promise<boolean> => {
  try {
    const htmlContent = braiderRejectedTemplate({ 
      braiderName, 
      status: 'rejected',
      reason,
      submissionDate,
      reviewDate
    })
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: 'Atualização sobre sua solicitação - Wilnara Tranças',
      html: htmlContent,
      text: `Olá, ${braiderName}!\n\nAgradecemos seu interesse em se tornar uma trancista parceira da Wilnara Tranças.\n\nApós análise cuidadosa, infelizmente não poderemos prosseguir com sua solicitação neste momento.${reason ? `\n\nFeedback: ${reason}` : ''}\n\nEncorajamos que continue aprimorando suas habilidades e pode tentar novamente no futuro.\n\nAgradecemos seu interesse e desejamos sucesso na sua jornada!\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Braider rejection email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send braider rejection email:', error)
    return false
  }
}

// Send booking confirmation email to client
export const sendBookingConfirmationEmail = async (
  email: string,
  bookingDetails: {
    clientName: string
    braiderName: string
    serviceName: string
    date: string
    time: string
    location: string
    bookingType: 'domicilio' | 'trancista'
    price: number
    duration: number
    clientPhone?: string
    clientAddress?: string
    braiderPhone?: string
    specialInstructions?: string
  }
): Promise<boolean> => {
  try {
    const htmlContent = bookingConfirmedTemplate(bookingDetails)
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `✅ Agendamento Confirmado com ${bookingDetails.braiderName} - Wilnara Tranças`,
      html: htmlContent,
      text: `Olá, ${bookingDetails.clientName}!\n\nSeu agendamento foi confirmado!\n\nTrancista: ${bookingDetails.braiderName}\nServiço: ${bookingDetails.serviceName}\nData: ${bookingDetails.date}\nHorário: ${bookingDetails.time}\nLocal: ${bookingDetails.location}\nValor: €${bookingDetails.price.toFixed(2)}\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Booking confirmation email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error)
    return false
  }
}

// Send booking rejection email to client
export const sendBookingRejectionEmail = async (
  email: string,
  bookingDetails: {
    clientName: string
    braiderName: string
    serviceName: string
    date: string
    time: string
    location: string
    bookingType: 'domicilio' | 'trancista'
    price: number
    duration: number
    clientPhone?: string
    clientAddress?: string
    braiderPhone?: string
    specialInstructions?: string
  }
): Promise<boolean> => {
  try {
    const htmlContent = bookingRejectedTemplate(bookingDetails)
    
    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `❌ Agendamento com ${bookingDetails.braiderName} - Wilnara Tranças`,
      html: htmlContent,
      text: `Olá, ${bookingDetails.clientName}!\n\nInfelizmente, seu agendamento não pôde ser confirmado.\n\nTrancista: ${bookingDetails.braiderName}\nServiço: ${bookingDetails.serviceName}\nData solicitada: ${bookingDetails.date}\nHorário solicitado: ${bookingDetails.time}\n\nPor favor, tente outros horários ou trancistas.\n\nWilnara Tranças`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Booking rejection email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send booking rejection email:', error)
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
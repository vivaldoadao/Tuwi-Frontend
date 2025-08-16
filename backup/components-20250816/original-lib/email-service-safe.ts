// Safer email service that doesn't interfere with webpack/NextAuth
// This version uses conditional loading to avoid conflicts

interface BookingEmailData {
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

// Safe email sending that doesn't break webpack
export async function sendBookingConfirmationEmailSafe(
  email: string,
  bookingDetails: BookingEmailData
): Promise<boolean> {
  try {
    // Only load nodemailer when actually needed
    if (typeof window !== 'undefined') {
      // Client-side - skip email
      console.log('📧 Client-side: Email would be sent to', email)
      return false
    }

    // Server-side - try to load email service
    const nodemailer = await import('nodemailer').catch(() => null)
    if (!nodemailer) {
      console.log('⚠️ Nodemailer not available, email not sent')
      return false
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Simple email template
    const htmlContent = `
      <h1>🎉 Agendamento Confirmado!</h1>
      <p>Olá, ${bookingDetails.clientName}!</p>
      <p>Seu agendamento com <strong>${bookingDetails.braiderName}</strong> foi confirmado!</p>
      
      <h3>📅 Detalhes:</h3>
      <ul>
        <li><strong>Serviço:</strong> ${bookingDetails.serviceName}</li>
        <li><strong>Data:</strong> ${bookingDetails.date}</li>
        <li><strong>Horário:</strong> ${bookingDetails.time}</li>
        <li><strong>Local:</strong> ${bookingDetails.location}</li>
        <li><strong>Valor:</strong> €${bookingDetails.price.toFixed(2)}</li>
      </ul>
      
      <p>Até breve!</p>
      <p><em>Equipe Wilnara Tranças</em></p>
    `

    const textContent = `
      Agendamento Confirmado!
      
      Olá, ${bookingDetails.clientName}!
      Seu agendamento com ${bookingDetails.braiderName} foi confirmado!
      
      Detalhes:
      - Serviço: ${bookingDetails.serviceName}
      - Data: ${bookingDetails.date}
      - Horário: ${bookingDetails.time}
      - Local: ${bookingDetails.location}
      - Valor: €${bookingDetails.price.toFixed(2)}
      
      Wilnara Tranças
    `

    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `✅ Agendamento Confirmado com ${bookingDetails.braiderName} - Wilnara Tranças`,
      html: htmlContent,
      text: textContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    return true

  } catch (error) {
    console.log('⚠️ Email service error (safe mode):', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export async function sendBookingRejectionEmailSafe(
  email: string,
  bookingDetails: BookingEmailData
): Promise<boolean> {
  try {
    // Only load nodemailer when actually needed
    if (typeof window !== 'undefined') {
      // Client-side - skip email
      console.log('📧 Client-side: Rejection email would be sent to', email)
      return false
    }

    // Server-side - try to load email service
    const nodemailer = await import('nodemailer').catch(() => null)
    if (!nodemailer) {
      console.log('⚠️ Nodemailer not available, rejection email not sent')
      return false
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Simple email template
    const htmlContent = `
      <h1>❌ Agendamento Não Aprovado</h1>
      <p>Olá, ${bookingDetails.clientName}!</p>
      <p>Infelizmente, a trancista <strong>${bookingDetails.braiderName}</strong> não conseguiu confirmar seu agendamento.</p>
      
      <h3>📅 Detalhes da Solicitação:</h3>
      <ul>
        <li><strong>Serviço:</strong> ${bookingDetails.serviceName}</li>
        <li><strong>Data Solicitada:</strong> ${bookingDetails.date}</li>
        <li><strong>Horário Solicitado:</strong> ${bookingDetails.time}</li>
        <li><strong>Local:</strong> ${bookingDetails.location}</li>
      </ul>
      
      <p>💡 <strong>Próximos Passos:</strong></p>
      <ul>
        <li>Tente outros horários disponíveis</li>
        <li>Explore outras trancistas na plataforma</li>
        <li>Entre em contato conosco para mais opções</li>
      </ul>
      
      <p>Não desista! Vamos encontrar uma solução para você! 💜</p>
      <p><em>Equipe Wilnara Tranças</em></p>
    `

    const textContent = `
      Agendamento Não Aprovado
      
      Olá, ${bookingDetails.clientName}!
      Infelizmente, a trancista ${bookingDetails.braiderName} não conseguiu confirmar seu agendamento.
      
      Detalhes da Solicitação:
      - Serviço: ${bookingDetails.serviceName}
      - Data Solicitada: ${bookingDetails.date}
      - Horário Solicitado: ${bookingDetails.time}
      - Local: ${bookingDetails.location}
      
      Por favor, tente outros horários ou trancistas.
      
      Wilnara Tranças
    `

    const mailOptions = {
      from: {
        name: 'Wilnara Tranças',
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@wilnaratracas.com'
      },
      to: email,
      subject: `❌ Agendamento com ${bookingDetails.braiderName} - Wilnara Tranças`,
      html: htmlContent,
      text: textContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Rejection email sent successfully:', result.messageId)
    return true

  } catch (error) {
    console.log('⚠️ Rejection email service error (safe mode):', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}
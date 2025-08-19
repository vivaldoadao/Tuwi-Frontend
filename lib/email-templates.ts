interface EmailTemplateProps {
  userName: string
  code?: string
  companyName?: string
  supportEmail?: string
}

interface OrderDetails {
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

interface OrderConfirmationProps {
  userName: string
  orderDetails: OrderDetails
}

interface BraiderNotificationProps {
  braiderName: string
  status: 'approved' | 'rejected'
  reason?: string
  submissionDate?: string
  reviewDate?: string
}

// Base template wrapper - Novo branding TUWI com cores sage green
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #f0f4f3 0%, #e8f5e8 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(52, 101, 73, 0.1);
            border: 1px solid #e8f5e8;
        }
        
        .header {
            background: linear-gradient(135deg, #346549 0%, #52a872 50%, #6bb387 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><pattern id="grain" patternUnits="userSpaceOnUse" width="4" height="4"><circle cx="2" cy="2" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="20" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            letter-spacing: 1px;
            position: relative;
            z-index: 1;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 50px 40px;
            background: linear-gradient(180deg, #ffffff 0%, #fafffe 100%);
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #346549;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 32px;
            line-height: 1.8;
            text-align: center;
        }
        
        .code-container {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            margin: 40px 0;
            border: 2px solid #6bb387;
            position: relative;
            overflow: hidden;
        }
        
        .code-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(107, 179, 135, 0.1) 10px, rgba(107, 179, 135, 0.1) 20px);
        }
        
        .code-label {
            font-size: 14px;
            color: #346549;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 16px;
            font-weight: 700;
            position: relative;
            z-index: 1;
        }
        
        .code {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 36px;
            font-weight: 800;
            color: #346549;
            letter-spacing: 6px;
            background: white;
            padding: 20px 32px;
            border-radius: 12px;
            display: inline-block;
            box-shadow: 0 8px 20px rgba(52, 101, 73, 0.15);
            border: 2px solid #52a872;
            position: relative;
            z-index: 1;
        }
        
        .expiry {
            font-size: 14px;
            color: #dc2626;
            margin-top: 20px;
            font-weight: 600;
            position: relative;
            z-index: 1;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #346549 0%, #52a872 50%, #6bb387 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(52, 101, 73, 0.3);
            border: 2px solid transparent;
            letter-spacing: 0.5px;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(52, 101, 73, 0.4);
            border-color: #6bb387;
        }
        
        .footer {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
            padding: 40px 30px;
            text-align: center;
            border-top: 3px solid #6bb387;
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #346549 0%, #52a872 50%, #6bb387 100%);
        }
        
        .footer p {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .footer .brand {
            font-weight: 800;
            color: #346549;
            font-size: 20px;
            margin-bottom: 20px;
            letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(52, 101, 73, 0.1);
        }
        
        .social-links {
            margin-top: 24px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 12px;
            color: #52a872;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: color 0.2s ease;
        }
        
        .social-links a:hover {
            color: #346549;
        }
        
        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #6bb387 20%, #52a872 50%, #6bb387 80%, transparent 100%);
            margin: 30px 0;
            border-radius: 1px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 12px;
            }
            
            .content {
                padding: 40px 24px;
            }
            
            .code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 16px 24px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .header {
                padding: 32px 20px;
            }
            
            .button {
                padding: 14px 28px;
                font-size: 15px;
            }
            
            .code-container {
                padding: 24px 16px;
                margin: 32px 0;
            }
        }
    </style>
</head>
<body>
        <div class="container">
            <div class="header">
                <h1>🌿 TUWI</h1>
                <p>Cuidados autênticos para cabelo africano em Portugal</p>
            </div>
            ${content}
            <div class="footer">
                <div class="brand">🌿 TUWI</div>
                <p>Obrigado por escolher os nossos serviços!</p>
                <p>Se não solicitou esta ação, ignore este email.</p>
                <div class="divider"></div>
                <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
                    Este é um email automático, por favor não responda.<br>
                    Para suporte: <a href="mailto:suporte@tuwi.pt" style="color: #52a872; text-decoration: none;">suporte@tuwi.pt</a><br>
                    <strong>TUWI</strong> - Especialistas em cuidados para cabelo africano 🌿
                </p>
            </div>
        </div>
</body>
</html>
`

// Password Reset Template
export const passwordResetTemplate = ({ userName, code }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Olá, ${userName}! 👋</div>
        <div class="message">
            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>TUWI</strong>.
            Use o código de verificação abaixo para continuar com a alteração da sua senha.
        </div>
        
        <div class="code-container">
            <div class="code-label">🔐 Código de Verificação</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Este código expira em 15 minutos</div>
        </div>
        
        <div class="message">
            <strong>Como usar o código:</strong><br>
            1️⃣ Aceda à página de redefinição de senha<br>
            2️⃣ Introduza este código de 6 dígitos<br>
            3️⃣ Crie a sua nova senha segura<br>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/reset-password/verify" class="button">
                🔐 Redefinir Senha
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Redefinir Senha - TUWI')
}

// Email Verification Template
export const emailVerificationTemplate = ({ userName, code }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Bem-vinda, ${userName}! 🌿✨</div>
        <div class="message">
            Ficamos muito felizes por se ter juntado à família <strong>TUWI</strong>!
            Para completar o seu registo e começar a descobrir os melhores cuidados para cabelo africano em Portugal, 
            precisamos verificar o seu endereço de email.
        </div>
        
        <div class="code-container">
            <div class="code-label">📧 Código de Verificação</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Este código expira em 30 minutos</div>
        </div>
        
        <div class="message">
            <strong>Como verificar o seu email:</strong><br>
            1️⃣ Aceda à página de verificação de email<br>
            2️⃣ Introduza este código de 6 dígitos<br>
            3️⃣ A sua conta será activada automaticamente<br>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/verify-email" class="button">
                ✅ Verificar Email
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Verificar Email - TUWI')
}

// Welcome Email Template
export const welcomeTemplate = ({ userName }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Seja bem-vinda, ${userName}! 🌿✨</div>
        <div class="message">
            A sua conta foi criada com sucesso no <strong>TUWI</strong>!
            Agora pode explorar os nossos serviços especializados, encontrar profissionais qualificadas 
            e fazer os seus agendamentos de forma prática e segura.
        </div>
        
        <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%); border-radius: 16px; padding: 32px; margin: 40px 0; border: 2px solid #6bb387;">
            <h3 style="color: #346549; margin-bottom: 20px; font-weight: 700;">🎯 O que pode fazer agora:</h3>
            <ul style="color: #4b5563; line-height: 2; padding-left: 24px; font-weight: 500;">
                <li>🌿 Explorar cuidados autênticos para cabelo africano</li>
                <li>💅 Encontrar trancistas especializadas na sua região</li>
                <li>📅 Agendar serviços de qualidade premium</li>
                <li>🛍️ Descobrir produtos naturais seleccionados</li>
                <li>👥 Juntar-se à nossa comunidade em Portugal</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}" class="button">
                🚀 Começar a Explorar
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Bem-vinda ao TUWI! 🌿')
}

// Order Confirmation Template
export const orderConfirmationTemplate = ({ userName, orderDetails }: OrderConfirmationProps): string => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const itemsHtml = orderDetails.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 20px 0; vertical-align: top;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                      border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                      font-size: 12px; color: #6b7280; text-align: center; flex-shrink: 0;">
            ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '📦<br>Produto'}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #1f2937; font-size: 16px; margin-bottom: 5px;">
              ${item.productName}
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              Quantidade: ${item.quantity}
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 20px 0; text-align: right; vertical-align: top; white-space: nowrap;">
        <div style="font-weight: 600; color: #1f2937; font-size: 16px;">
          ${formatCurrency(item.subtotal)}
        </div>
        <div style="color: #6b7280; font-size: 14px;">
          ${formatCurrency(item.productPrice)} × ${item.quantity}
        </div>
      </td>
    </tr>
  `).join('')

  const content = `
    <div class="content">
        <div class="greeting">Olá, ${userName}! 🎉</div>
        <div class="message">
            A sua encomenda foi confirmada com sucesso! Estamos a preparar tudo com muito carinho para si.
        </div>
        
        <!-- Order Status -->
        <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); 
                        border-radius: 12px; padding: 25px; display: inline-block; min-width: 280px;">
                <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                <div style="font-size: 20px; font-weight: 700; color: #059669; margin-bottom: 10px;">
                    Encomenda Confirmada!
                </div>
                <div style="font-size: 16px; color: #065f46; font-weight: 600;">
                    Encomenda #${orderDetails.orderId}
                </div>
                <div style="font-size: 14px; color: #065f46; margin-top: 5px;">
                    ${formatDate(orderDetails.orderDate)}
                </div>
            </div>
        </div>

        <!-- Order Summary -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                📦 Resumo da Encomenda
            </h3>
            
            <!-- Items Table -->
            <div style="background: white; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 15px 20px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">
                                Produto
                            </th>
                            <th style="padding: 15px 20px; text-align: right; font-size: 14px; font-weight: 600; color: #374151;">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Order Totals -->
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 16px;">Subtotal:</span>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 500;">${formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 16px;">Envio:</span>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 500;">${formatCurrency(orderDetails.shippingCost)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-top: 8px;">
                    <span style="color: #1f2937; font-size: 18px; font-weight: 700;">Total:</span>
                    <span style="color: #8B5CF6; font-size: 20px; font-weight: 700;">${formatCurrency(orderDetails.total)}</span>
                </div>
            </div>
        </div>

        <!-- Shipping Information -->
        <div style="background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bae6fd;">
            <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                🚚 Endereço de Entrega
            </h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                    <div style="font-weight: 600; margin-bottom: 8px;">${orderDetails.customerName}</div>
                    <div>${orderDetails.shippingAddress}</div>
                    <div>${orderDetails.shippingCity}, ${orderDetails.shippingPostalCode}</div>
                    <div>${orderDetails.shippingCountry}</div>
                </div>
            </div>
        </div>

        <!-- Payment Confirmation -->
        ${orderDetails.paymentIntentId ? `
        <div style="background: #ecfdf5; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bbf7d0;">
            <h3 style="color: #065f46; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                💳 Pagamento Confirmado
            </h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="color: #059669; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                    ✅ Pagamento processado com sucesso
                </div>
                <div style="color: #6b7280; font-size: 14px;">
                    ID da transação: ${orderDetails.paymentIntentId}
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                📋 Próximos Passos
            </h3>
            <div style="color: #78350f; line-height: 1.7;">
                <p style="margin-bottom: 10px;">1. <strong>Processamento:</strong> Estamos a preparar os seus produtos</p>
                <p style="margin-bottom: 10px;">2. <strong>Envio:</strong> Receberá o código de rastreamento em breve</p>
                <p style="margin-bottom: 10px;">3. <strong>Entrega:</strong> Estimativa de 5-7 dias úteis</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/orders" class="button" style="margin-right: 15px;">
                📋 Acompanhar Encomenda
            </a>
            <a href="${process.env.NEXTAUTH_URL}/products" class="button" style="background: linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%);">
                🛍️ Continuar Compras
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, `Encomenda Confirmada #${orderDetails.orderId} - TUWI`)
}

// Order Tracking Update Template
interface OrderTrackingProps {
  userName: string
  orderDetails: {
    orderId: string
    customerName: string
    total: number
    status: string
  }
  trackingEvent: {
    title: string
    description?: string
    location?: string
    trackingNumber?: string
    eventType: string
    createdAt: string
  }
}

export const orderTrackingTemplate = ({ userName, orderDetails, trackingEvent }: OrderTrackingProps): string => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusEmoji = (eventType: string) => {
    switch (eventType) {
      case 'order_created': return '📦'
      case 'payment_confirmed': return '💳'
      case 'processing_started': return '⚙️'
      case 'shipped': return '🚚'
      case 'out_for_delivery': return '🛵'
      case 'delivered': return '✅'
      case 'cancelled': return '❌'
      case 'returned': return '↩️'
      case 'refunded': return '💰'
      default: return '📋'
    }
  }

  const getStatusColor = (eventType: string) => {
    switch (eventType) {
      case 'order_created': return '#3b82f6'
      case 'payment_confirmed': return '#10b981'
      case 'processing_started': return '#f59e0b'
      case 'shipped': return '#8b5cf6'
      case 'out_for_delivery': return '#f97316'
      case 'delivered': return '#059669'
      case 'cancelled': return '#dc2626'
      case 'returned': return '#6b7280'
      case 'refunded': return '#6366f1'
      default: return '#6b7280'
    }
  }

  const statusColor = getStatusColor(trackingEvent.eventType)
  const statusEmoji = getStatusEmoji(trackingEvent.eventType)

  const content = `
    <div class="content">
        <div class="greeting">Olá, ${userName}! ${statusEmoji}</div>
        <div class="message">
            Temos uma atualização sobre seu pedido <strong>#${orderDetails.orderId.slice(0, 8).toUpperCase()}</strong>
        </div>
        
        <!-- Status Update Card -->
        <div style="background: linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}08 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid ${statusColor}30;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${statusEmoji}</div>
                <h2 style="color: ${statusColor}; font-size: 24px; font-weight: 700; margin: 0;">
                    ${trackingEvent.title}
                </h2>
                <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">
                    ${formatDate(trackingEvent.createdAt)}
                </div>
            </div>
            
            ${trackingEvent.description ? `
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0;">
                    ${trackingEvent.description}
                </p>
            </div>
            ` : ''}
            
            ${trackingEvent.location ? `
            <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <div style="color: #1f2937; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${statusColor};">📍</span>
                    <strong>Localização:</strong> ${trackingEvent.location}
                </div>
            </div>
            ` : ''}
            
            ${trackingEvent.trackingNumber ? `
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px dashed ${statusColor}30;">
                <div style="color: #1f2937; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
                    📦 Código de Rastreamento:
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700; color: ${statusColor}; padding: 10px; background: ${statusColor}10; border-radius: 6px; text-align: center;">
                    ${trackingEvent.trackingNumber}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Order Summary -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                📋 Resumo do Pedido
            </h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">Pedido:</span>
                    <span style="color: #1f2937; font-weight: 600;">#${orderDetails.orderId.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">Cliente:</span>
                    <span style="color: #1f2937; font-weight: 600;">${orderDetails.customerName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 12px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #1f2937; font-size: 16px; font-weight: 700;">Total:</span>
                    <span style="color: #8B5CF6; font-size: 18px; font-weight: 700;">${formatCurrency(orderDetails.total)}</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/track-order" class="button" style="margin-right: 15px;">
                🔍 Rastrear Pedido
            </a>
            <a href="${process.env.NEXTAUTH_URL}/products" class="button" style="background: linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%);">
                🛍️ Continuar Comprando
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, `${trackingEvent.title} - Pedido #${orderDetails.orderId.slice(0, 8).toUpperCase()} - TUWI`)
}

// Helper function to format dates
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Não informada'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Braider application approved template
export const braiderApprovedTemplate = ({ braiderName, submissionDate, reviewDate }: BraiderNotificationProps) => {
  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px; color: white;">✅</span>
        </div>
        <h2 style="color: #10B981; font-size: 28px; font-weight: 700; margin: 0 0 10px;">
            🎉 Parabéns! Sua solicitação foi aprovada!
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
            Bem-vinda à família TUWI!
        </p>
    </div>

    <div class="greeting">Olá, ${braiderName}! 👋</div>
    
    <div class="message">
        <p>Temos o prazer de informar que a sua solicitação para se tornar uma trancista parceira do <strong>TUWI</strong> foi <strong style="color: #52a872;">APROVADA</strong>! 🌿✨</p>
        
        <p>Sua candidatura demonstrou excelência profissional e se alinha perfeitamente com os nossos padrões de qualidade. Estamos animados para tê-la em nossa rede de profissionais!</p>
    </div>

    <!-- Application Details -->
    <div style="background: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #10B981;">
        <h3 style="color: #065f46; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            📋 Detalhes da Solicitação
        </h3>
        <div style="display: grid; gap: 12px;">
            ${submissionDate ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Data da Submissão:</span>
                <span style="color: #6b7280;">${formatDate(submissionDate)}</span>
            </div>
            ` : ''}
            ${reviewDate ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Data da Aprovação:</span>
                <span style="color: #10B981; font-weight: 600;">${formatDate(reviewDate)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Status:</span>
                <span style="background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✅ APROVADA</span>
            </div>
        </div>
    </div>

    <!-- Next Steps -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white;">
        <h3 style="color: white; font-size: 20px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            🚀 Próximos Passos
        </h3>
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">1</span>
                <div>
                    <strong style="color: white;">Acesse sua conta:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Faça login com o email usado na candidatura</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">2</span>
                <div>
                    <strong style="color: white;">Complete seu perfil:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Adicione fotos do seu trabalho e ajuste suas informações</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">3</span>
                <div>
                    <strong style="color: white;">Comece a receber clientes:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Seu perfil ficará visível para clientes em sua região</p>
                </div>
            </div>
        </div>
    </div>

    <div class="message">
        <p>Estamos aqui para apoiá-la em cada passo desta jornada. Se tiver qualquer dúvida, não hesite em nos contactar.</p>
        
        <p><strong>Bem-vinda à família TUWI! 🌿💚</strong></p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/login" class="button" style="margin-right: 15px;">
            🔑 Fazer Login
        </a>
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/braider-dashboard" class="button" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            📊 Acessar Dashboard
        </a>
    </div>
  `
  
  return baseTemplate(content, `🎉 Solicitação Aprovada - TUWI`)
}

// Braider application rejected template
export const braiderRejectedTemplate = ({ braiderName, reason, submissionDate, reviewDate }: BraiderNotificationProps) => {
  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px; color: white;">✋</span>
        </div>
        <h2 style="color: #EF4444; font-size: 28px; font-weight: 700; margin: 0 0 10px;">
            Atualização sobre sua solicitação
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
            Obrigado pelo seu interesse em se juntar à nossa equipe
        </p>
    </div>

    <div class="greeting">Olá, ${braiderName}! 👋</div>
    
    <div class="message">
        <p>Agradecemos sinceramente pelo seu interesse em se tornar uma trancista parceira do <strong>TUWI</strong>.</p>
        
        <p>Após uma análise cuidadosa da sua candidatura, infelizmente não poderemos prosseguir com sua solicitação neste momento.</p>
    </div>

    <!-- Application Details -->
    <div style="background: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #EF4444;">
        <h3 style="color: #991b1b; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            📋 Detalhes da Solicitação
        </h3>
        <div style="display: grid; gap: 12px;">
            ${submissionDate ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Data da Submissão:</span>
                <span style="color: #6b7280;">${formatDate(submissionDate)}</span>
            </div>
            ` : ''}
            ${reviewDate ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Data da Revisão:</span>
                <span style="color: #EF4444; font-weight: 600;">${formatDate(reviewDate)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 600;">Status:</span>
                <span style="background: #EF4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">❌ NÃO APROVADA</span>
            </div>
        </div>
    </div>

    ${reason ? `
    <!-- Reason -->
    <div style="background: #fffbeb; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #F59E0B;">
        <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            💬 Feedback da Nossa Equipe
        </h3>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
            ${reason}
        </p>
    </div>
    ` : ''}

    <!-- Encouragement -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white;">
        <h3 style="color: white; font-size: 20px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            🌟 Não Desista dos Seus Sonhos!
        </h3>
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">💪</span>
                <div>
                    <strong style="color: white;">Continue aprimorando suas habilidades:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Cada experiência é uma oportunidade de crescimento</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">🔄</span>
                <div>
                    <strong style="color: white;">Pode candidatar-se novamente:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Encorajamos que tente novamente no futuro</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">❤️</span>
                <div>
                    <strong style="color: white;">Admiramos sua paixão:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Sua dedicação às tranças é inspiradora</p>
                </div>
            </div>
        </div>
    </div>

    <div class="message">
        <p>Agradecemos novamente pelo seu interesse e desejamos muito sucesso na sua jornada profissional.</p>
        
        <p>Continue brilhando com seu talento! ✨</p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}" class="button" style="margin-right: 15px;">
            🏠 Visitar Site
        </a>
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/register-braider" class="button" style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);">
            🔄 Candidatar-se Novamente
        </a>
    </div>
  `
  
  return baseTemplate(content, `Atualização da Sua Solicitação - TUWI`)
}

// Booking confirmation interface
interface BookingNotificationProps {
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

// Booking confirmed template (sent to client)
export const bookingConfirmedTemplate = ({ 
  clientName, 
  braiderName, 
  serviceName, 
  date, 
  time, 
  location, 
  bookingType, 
  price, 
  duration,
  clientPhone,
  clientAddress,
  braiderPhone,
  specialInstructions
}: BookingNotificationProps) => {
  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px; color: white;">✅</span>
        </div>
        <h2 style="color: #10B981; font-size: 28px; font-weight: 700; margin: 0 0 10px;">
            🎉 Agendamento Confirmado!
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
            Sua consulta foi aprovada pela trancista
        </p>
    </div>

    <div class="greeting">Olá, ${clientName}! 👋</div>
    
    <div class="message">
        <p>Excelentes notícias! Sua consulta com a <strong>${braiderName}</strong> foi <strong>confirmada</strong>! 🎊</p>
        
        <p>Estamos ansiosos para cuidar dos seus cabelos com todo o carinho e profissionalismo que merece.</p>
    </div>

    <!-- Booking Details -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white;">
        <h3 style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            📅 Detalhes do Agendamento
        </h3>
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px;">
            <div style="margin-bottom: 15px;">
                <strong>Serviço:</strong> ${serviceName}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Data:</strong> ${formatBookingDate(date)}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Horário:</strong> ${time}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Duração:</strong> ${duration} minutos
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Local:</strong> ${bookingType === 'domicilio' ? '🏠 Ao Domicílio' : '💺 No Salão'} - ${location}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Trancista:</strong> ${braiderName}
            </div>
            ${braiderPhone ? `<div style="margin-bottom: 15px;"><strong>Telefone da Trancista:</strong> ${braiderPhone}</div>` : ''}
            <div style="padding-top: 15px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
                <strong style="font-size: 18px;">Valor: €${price.toFixed(2)}</strong>
            </div>
        </div>
    </div>

    ${bookingType === 'domicilio' && clientAddress ? `
    <!-- Address Details -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            🏠 Endereço para Atendimento
        </h3>
        <div style="background: white; border-radius: 8px; padding: 20px;">
            <p style="color: #1f2937; font-size: 16px; margin: 0;">${clientAddress}</p>
        </div>
    </div>
    ` : ''}

    ${specialInstructions ? `
    <!-- Special Instructions -->
    <div style="background: #fef7e0; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            📝 Instruções Especiais
        </h3>
        <div style="background: white; border-radius: 8px; padding: 20px;">
            <p style="color: #1f2937; font-size: 16px; margin: 0;">${specialInstructions}</p>
        </div>
    </div>
    ` : ''}

    <!-- Important Notes -->
    <div style="background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white;">
        <h3 style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            💡 Informações Importantes
        </h3>
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px;">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">1</span>
                <div>
                    <strong>Chegue no horário:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Seja pontual para garantir o melhor atendimento</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">2</span>
                <div>
                    <strong>Contato direto:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">${braiderPhone ? `Entre em contacto com ${braiderName} pelo ${braiderPhone}` : 'A trancista entrará em contacto consigo'}</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">3</span>
                <div>
                    <strong>Cancelamentos:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Avise com pelo menos 2 horas de antecedência</p>
                </div>
            </div>
        </div>
    </div>

    <div class="message">
        <p>Mal podemos esperar para a deixar ainda mais linda! 🌿💚</p>
        
        <p><strong>Até breve!</strong></p>
        <p><em>Equipa TUWI</em></p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/braiders" class="button" style="margin-right: 15px;">
            👩‍🦱 Ver Trancistas
        </a>
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/dashboard" class="button" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            📊 Meu Painel
        </a>
    </div>
  `
  
  return baseTemplate(content, `✅ Agendamento Confirmado - TUWI`)
}

// Booking rejected template (sent to client)
export const bookingRejectedTemplate = ({ 
  clientName, 
  braiderName, 
  serviceName, 
  date, 
  time, 
  location, 
  bookingType, 
  price,
  specialInstructions
}: BookingNotificationProps) => {
  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px; color: white;">❌</span>
        </div>
        <h2 style="color: #EF4444; font-size: 28px; font-weight: 700; margin: 0 0 10px;">
            Agendamento Não Aprovado
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
            Infelizmente sua solicitação não pôde ser atendida
        </p>
    </div>

    <div class="greeting">Olá, ${clientName}! 👋</div>
    
    <div class="message">
        <p>Agradecemos o seu interesse nos nossos serviços e por escolher o <strong>TUWI</strong>.</p>
        
        <p>Infelizmente, a trancista <strong>${braiderName}</strong> não conseguiu confirmar o seu agendamento para o horário solicitado.</p>
    </div>

    <!-- Booking Details -->
    <div style="background: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #fecaca;">
        <h3 style="color: #991b1b; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            📅 Detalhes da Solicitação
        </h3>
        <div style="background: white; border-radius: 8px; padding: 20px;">
            <div style="margin-bottom: 15px; color: #374151;">
                <strong>Serviço:</strong> ${serviceName}
            </div>
            <div style="margin-bottom: 15px; color: #374151;">
                <strong>Data Solicitada:</strong> ${formatBookingDate(date)}
            </div>
            <div style="margin-bottom: 15px; color: #374151;">
                <strong>Horário Solicitado:</strong> ${time}
            </div>
            <div style="margin-bottom: 15px; color: #374151;">
                <strong>Local:</strong> ${bookingType === 'domicilio' ? '🏠 Ao Domicílio' : '💺 No Salão'} - ${location}
            </div>
            <div style="color: #374151;">
                <strong>Trancista:</strong> ${braiderName}
            </div>
        </div>
    </div>

    <!-- Alternative Options -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white;">
        <h3 style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            💡 Próximos Passos
        </h3>
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px;">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">1</span>
                <div>
                    <strong>Experimente outros horários:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">A trancista pode ter disponibilidade em outros horários</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">2</span>
                <div>
                    <strong>Outras trancistas:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Temos muitas profissionais talentosas disponíveis</p>
                </div>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px; border-radius: 50%; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">3</span>
                <div>
                    <strong>Contacto direto:</strong>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Entre em contacto connosco para mais opções</p>
                </div>
            </div>
        </div>
    </div>

    <div class="message">
        <p>Não desista! Estamos aqui para ajudá-la a encontrar o horário perfeito.</p>
        
        <p><strong>Continue tentando - vamos encontrar uma solução! 💜</strong></p>
        <p><em>Equipa TUWI</em></p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/braiders" class="button" style="margin-right: 15px;">
            👩‍🦱 Ver Outras Trancistas
        </a>
        <a href="${process.env.NEXTAUTH_URL || 'https://tuwi.pt'}/braiders" class="button" style="background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);">
            🔄 Tentar Novamente
        </a>
    </div>
  `
  
  return baseTemplate(content, `❌ Agendamento Não Aprovado - TUWI`)
}

// Helper function to format booking dates
const formatBookingDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}